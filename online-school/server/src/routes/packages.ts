import { Router } from 'express';
import { z } from 'zod';
import { Package } from '../models/Package';
import { validate } from '../middleware/validation';
import { auth, admin, AuthRequest } from '../middleware/auth';
import { getPresignedUrl } from '../services/r2';

const router = Router();

const packageSchema = z.object({
  body: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    price: z.number().positive(),
    category: z.enum(['OGE-IST', 'EGE-IST', 'EGE-SOC']),
    materials: z.array(z.object({
      type: z.enum(['video', 'text', 'image', 'file']),
      title: z.string(),
      r2Key: z.string().optional(),
      url: z.string().optional(),
      content: z.string().optional(),
    })).optional(),
  }),
});

router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const packages = await Package.find(query).sort({ createdAt: -1 });
    res.json({ packages });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const pkg = await Package.findOne({ slug });
    
    if (!pkg) {
      res.status(404).json({ message: 'Package not found' });
      return;
    }

    res.json({ package: pkg });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug/content', auth, async (req: AuthRequest, res, next) => {
  try {
    const { slug } = req.params;
    const userId = req.user!._id;

    const Purchase = (await import('../models/Purchase')).Purchase;
    const purchase = await Purchase.findOne({
      userId,
      status: 'paid',
    }).populate('packageId');

    const pkg = await Package.findOne({ slug });
    if (!pkg) {
      res.status(404).json({ message: 'Package not found' });
      return;
    }

    const hasAccess = purchase && 
      (purchase.packageId as any)._id.toString() === pkg._id.toString();

    if (!hasAccess) {
      res.status(403).json({ message: 'No access to this package. Please purchase it first.' });
      return;
    }

    const materialsWithUrls = await Promise.all(
      pkg.materials.map(async (material) => {
        if (material.r2Key) {
          const url = await getPresignedUrl(material.r2Key, 12);
          return { ...material, url };
        }
        return material;
      })
    );

    res.json({
      package: {
        ...pkg.toObject(),
        materials: materialsWithUrls,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, admin, validate(packageSchema), async (req, res, next) => {
  try {
    const { title, slug, description, price, category, materials } = req.body;

    const existingPackage = await Package.findOne({ slug });
    if (existingPackage) {
      res.status(400).json({ message: 'Package with this slug already exists' });
      return;
    }

    const pkg = new Package({ title, slug, description, price, category, materials });
    await pkg.save();

    res.status(201).json({ message: 'Package created successfully', package: pkg });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, admin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, slug, description, price, category, materials } = req.body;

    const pkg = await Package.findByIdAndUpdate(
      id,
      { title, slug, description, price, category, materials },
      { new: true, runValidators: true }
    );

    if (!pkg) {
      res.status(404).json({ message: 'Package not found' });
      return;
    }

    res.json({ message: 'Package updated successfully', package: pkg });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, admin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const pkg = await Package.findByIdAndDelete(id);

    if (!pkg) {
      res.status(404).json({ message: 'Package not found' });
      return;
    }

    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
