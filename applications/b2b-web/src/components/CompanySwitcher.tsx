import type { CompanySummary } from '@qred/b2b-app-schemas';

type Props = {
  companies: CompanySummary[];
  value: string | undefined;
  onChange: (companyId: string) => void;
};

// Full-width "Company AB ⌄" bar. Lists only the companies of the signed-in user
// (GET /v1/user/companies) and is shown even when there is just one.
export const CompanySwitcher = ({ companies, value, onChange }: Props) => (
  <label className="company-bar">
    <span className="visually-hidden">Company</span>
    <select aria-label="Company" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {companies.map((company) => (
        <option key={company.id} value={company.id}>
          {company.legalName}
        </option>
      ))}
    </select>
  </label>
);
