import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const ProductRatingStars = ({
  className,
  starClassName,
  showLabel = false,
  label = '5.0',
  labelClassName,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)} aria-label="Rated 5 out of 5 stars">
      <div className="flex items-center gap-0.5 text-primary">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={cn('h-3.5 w-3.5 fill-current stroke-[1.75]', starClassName)}
            aria-hidden="true"
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn('text-xs font-semibold tracking-wide text-muted-foreground', labelClassName)}>
          {label}
        </span>
      )}
    </div>
  );
};

export default ProductRatingStars;
