import { Star } from 'lucide-react';

const StarRating = ({ rating, reviews }) => {
    const numericRating = parseFloat(rating);
    if (isNaN(numericRating)) {
        return null; // Don't render anything if the rating isn't a valid number
    }

    return (
        <div className="flex items-center">
            <div className="flex items-center">{[...Array(5)].map((_, i) => ( <Star key={i} className={`h-4 w-4 ${i < Math.round(numericRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} /> ))}</div>
            <span className="text-gray-600 text-sm ml-2">{numericRating.toFixed(1)} ({reviews} reviews)</span>
        </div>
    );
};
export default StarRating;