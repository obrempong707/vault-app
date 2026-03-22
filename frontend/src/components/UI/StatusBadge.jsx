import { getStatusColor } from '../../data/mockData';

const StatusBadge = ({ status }) => {
  const colors = getStatusColor(status);
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} mr-2`}></span>
      {label}
    </span>
  );
};

export default StatusBadge;
