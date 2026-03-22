const Card = ({ children, className = '', hover = false }) => {
  return (
    <div 
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${
        hover ? 'hover:shadow-md hover:border-slate-300 transition-all duration-200' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
