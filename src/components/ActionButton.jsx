import { Button } from "../ui";

// Legacy wrapper — new code should use Button from src/ui.
export function ActionButton({ children, variant = "primary", ...props }) {
  return (
    <Button variant={variant} {...props}>
      {children}
    </Button>
  );
}
