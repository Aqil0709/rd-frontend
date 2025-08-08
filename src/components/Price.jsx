const Price = ({ amount, className = "" }) => (
    <span className={`text-xl font-bold text-gray-900 ${className}`}>
        ₹{Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
    </span>
);
export default Price;
