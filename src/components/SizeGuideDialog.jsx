import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';

const SIZE_GUIDE_ROWS = [
  { size: 'XS', width: 40.64, length: 68.58, sleeve: 20.30, tolerance: 3.81 },
  { size: 'S', width: 45.72, length: 71.12, sleeve: 20.90, tolerance: 3.81 },
  { size: 'M', width: 50.80, length: 73.66, sleeve: 21.60, tolerance: 3.81 },
  { size: 'L', width: 55.88, length: 76.20, sleeve: 22.20, tolerance: 3.81 },
  { size: 'XL', width: 60.96, length: 78.74, sleeve: 22.90, tolerance: 3.81 },
  { size: '2XL', width: 66.04, length: 81.28, sleeve: 23.50, tolerance: 3.81 },
  { size: '3XL', width: 71.12, length: 83.82, sleeve: 24.10, tolerance: 3.81 },
  { size: '4XL', width: 76.20, length: 86.36, sleeve: 24.70, tolerance: 3.81 },
  { size: '5XL', width: 81.28, length: 88.90, sleeve: 25.30, tolerance: 3.81 },
];

const formatCm = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : '';
};

const SizeGuideDialog = ({ className = '' }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button
        type="button"
        variant="link"
        size="sm"
        className={`h-auto p-0 text-xs font-semibold ${className}`}
      >
        Size Guide
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Size guide</DialogTitle>
        <DialogDescription>
          Measurements are shown in centimeters.
        </DialogDescription>
      </DialogHeader>

      <Table>
        <TableCaption>
          Size tolerance is the allowed measurement variation.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[88px]">Size</TableHead>
            <TableHead>Width, cm</TableHead>
            <TableHead>Length, cm</TableHead>
            <TableHead>Sleeve length, cm</TableHead>
            <TableHead>Tolerance, cm</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SIZE_GUIDE_ROWS.map((row) => (
            <TableRow key={row.size}>
              <TableCell className="font-semibold">{row.size}</TableCell>
              <TableCell className="font-variant-tabular">{formatCm(row.width)}</TableCell>
              <TableCell className="font-variant-tabular">{formatCm(row.length)}</TableCell>
              <TableCell className="font-variant-tabular">{formatCm(row.sleeve)}</TableCell>
              <TableCell className="font-variant-tabular">{formatCm(row.tolerance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DialogContent>
  </Dialog>
);

export default SizeGuideDialog;

