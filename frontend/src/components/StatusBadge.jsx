const STATUS_LABELS = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const BADGE_CLASSES = {
  PLACED: 'badge-placed',
  CONFIRMED: 'badge-confirmed',
  PREPARING: 'badge-preparing',
  OUT_FOR_DELIVERY: 'badge-out_for_delivery',
  DELIVERED: 'badge-delivered',
  CANCELLED: 'badge-cancelled',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${BADGE_CLASSES[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
