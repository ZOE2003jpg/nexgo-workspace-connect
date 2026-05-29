import {
  useNavigate as tsUseNavigate,
  useLocation as tsUseLocation,
  Navigate as TSNavigate,
  Link as TSLink,
  type LinkProps as TSLinkProps,
} from "@tanstack/react-router";
import { forwardRef } from "react";

/**
 * Thin react-router-dom compatibility shim backed by TanStack Router.
 * Lets ported code keep its existing API surface.
 */

export function useNavigate() {
  const nav = tsUseNavigate();
  return (to: string, opts?: { replace?: boolean }) => {
    nav({ to: to as never, replace: opts?.replace });
  };
}

export function useLocation() {
  return tsUseLocation();
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  return <TSNavigate to={to as never} replace={replace} />;
}

type NavLinkRenderProps = { isActive: boolean; isPending: boolean };
type NavLinkClass = string | ((p: NavLinkRenderProps) => string | undefined);
type NavLinkChildren =
  | React.ReactNode
  | ((p: NavLinkRenderProps) => React.ReactNode);

interface NavLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> {
  to: string;
  className?: NavLinkClass;
  children?: NavLinkChildren;
  end?: boolean;
}

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, className, children, end, ...rest }, ref) => {
    return (
      <TSLink
        ref={ref as never}
        to={to as never}
        activeOptions={{ exact: !!end }}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {(state: { isActive: boolean }) => {
          const renderProps: NavLinkRenderProps = {
            isActive: state.isActive,
            isPending: false,
          };
          const resolvedClass =
            typeof className === "function" ? className(renderProps) : className;
          const resolvedChildren =
            typeof children === "function" ? children(renderProps) : children;
          return (
            <span className={resolvedClass ?? undefined}>{resolvedChildren}</span>
          );
        }}
      </TSLink>
    );
  },
);
NavLink.displayName = "NavLink";

export type { TSLinkProps as LinkProps };