import type { HTMLAttributes } from 'react';
import { cx } from './util.ts';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Hover affordance for clickable cards (parcel rows on mobile/pvz). */
  interactive?: boolean;
}

/**
 * Card — surface container. Padding follows density (`--cui-card-pad`). Compose
 * with Card.Header / Card.Body / Card.Footer, or drop arbitrary children in.
 */
export function Card({ interactive = false, className, ...rest }: CardProps) {
  return <div className={cx('cui', 'cui-card', interactive && 'cui-card--interactive', className)} {...rest} />;
}

function Header({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('cui-card__header', className)} {...rest} />;
}
function Body({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('cui-card__body', className)} {...rest} />;
}
function Footer({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('cui-card__footer', className)} {...rest} />;
}

Card.Header = Header;
Card.Body = Body;
Card.Footer = Footer;
