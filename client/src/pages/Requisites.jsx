import LegalPageLayout, { LegalSection } from '../components/LegalPageLayout';
import { LEGAL_INFO } from '../constants/legalInfo';

function Row({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-gray-100 py-2 sm:flex-row sm:gap-4">
      <dt className="w-full shrink-0 font-medium text-gray-500 sm:w-64">{label}</dt>
      <dd className="text-gray-900">{value}</dd>
    </div>
  );
}

export default function Requisites() {
  return (
    <LegalPageLayout
      title="Реквизиты"
      subtitle={`Сведения о продавце — ${LEGAL_INFO.brand}`}
      updatedAt={LEGAL_INFO.docDate}
    >
      <p>
        Продавцом товаров (услуг) на сайте является указанное ниже лицо. Реквизиты приведены в
        соответствии с требованиями законодательства РФ и платёжных систем.
      </p>

      <LegalSection title="Данные продавца">
        <dl className="mt-2">
          <Row label="Наименование / ФИО" value={LEGAL_INFO.sellerName} />
          <Row label="Правовой статус" value={LEGAL_INFO.sellerStatus} />
          <Row label="ИНН" value={LEGAL_INFO.inn} />
          <Row label="Город" value={LEGAL_INFO.city} />
          <Row label="E-mail" value={LEGAL_INFO.email} />
          <Row label="Телефон" value={LEGAL_INFO.phone} />
          <Row label="Сайт" value={LEGAL_INFO.siteUrl} />
        </dl>
      </LegalSection>

      <LegalSection title="Как связаться">
        <p>
          По любым вопросам оплаты, доступа к материалам и возврата пишите на{' '}
          <a href={`mailto:${LEGAL_INFO.email}`} className="text-primary underline">
            {LEGAL_INFO.email}
          </a>{' '}
          или в чат поддержки на сайте — обычно отвечаем в течение рабочего дня.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
