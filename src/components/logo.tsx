export const Logo = ({
  className,
  iconOnly,
}: {
  className?: string;
  iconOnly?: boolean;
}) => {
  if (iconOnly) {
    return (
      <div
        className={`text-2xl font-bold text-primary flex justify-center items-center gap-1 ${className}`}
      >
        <svg
          width="35"
          height="35"
          viewBox="0 0 110 106"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100.83 28.63L66.86 3.95c-7.25-5.26-17.07-5.26-24.35 0L8.54 28.63C1.29 33.89-1.76 43.23 1.01 51.77l12.98 39.93c2.77 8.53 10.72 14.3 19.7 14.3h41.97c8.98 0 16.93-5.76 19.7-14.3l12.98-39.93c2.77-8.53-.28-17.88-7.53-23.14ZM64.81 63.13l-10.13 18.55-10.13-18.55-18.55-10.13 18.55-10.13 10.13-18.55 10.13 18.55 18.55 10.13-18.55 10.13Z"
            fill="#3B82F6"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`text-2xl font-bold text-primary flex justify-center items-center gap-1 ${className}`}
    >
      <svg
        width="35"
        height="35"
        viewBox="0 0 110 106"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100.83 28.63L66.86 3.95c-7.25-5.26-17.07-5.26-24.35 0L8.54 28.63C1.29 33.89-1.76 43.23 1.01 51.77l12.98 39.93c2.77 8.53 10.72 14.3 19.7 14.3h41.97c8.98 0 16.93-5.76 19.7-14.3l12.98-39.93c2.77-8.53-.28-17.88-7.53-23.14ZM64.81 63.13l-10.13 18.55-10.13-18.55-18.55-10.13 18.55-10.13 10.13-18.55 10.13 18.55 18.55 10.13-18.55 10.13Z"
          fill="#3B82F6"
        />
      </svg>
      Practice<span className=" text-blue-500 font-black">SAT</span>
    </div>
  );
};
