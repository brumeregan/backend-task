import { devUsers } from '../lib/devUsers';

type Props = { value: number; onChange: (index: number) => void };

// Dev-only: lets you switch seeded users to demo tenant isolation.
export const UserSwitcher = ({ value, onChange }: Props) => (
  <label className="switcher dev">
    Signed in as
    <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {devUsers.map((user, index) => (
        <option key={user.token} value={index}>
          {user.name}
        </option>
      ))}
    </select>
  </label>
);
