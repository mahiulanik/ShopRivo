export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {Icon ? (
        <div className="rounded-full bg-gray-100 p-4 text-gray-400 dark:bg-gray-800">
          <Icon size={28} />
        </div>
      ) : null}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? <p className="max-w-md text-sm text-gray-500">{description}</p> : null}
      {action}
    </div>
  );
}
