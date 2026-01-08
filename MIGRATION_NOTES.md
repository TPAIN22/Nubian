# Migration Notes

## Important: Store File Migration

The cart store has been migrated from JavaScript to TypeScript:

- **Old file**: `store/useCartStore.js` (can be removed after testing)
- **New file**: `store/useCartStore.ts` (use this)

### Action Required

1. **Test the new TypeScript store** to ensure everything works
2. **Remove the old JavaScript file** once confirmed working:
   ```bash
   rm store/useCartStore.js
   ```

### Import Changes

The new store exports optimized selectors. Update imports if needed:

```typescript
// Old way (still works)
import useCartStore from "@/store/useCartStore";
const { cart, isLoading } = useCartStore();

// New optimized way (recommended)
import useCartStore, { useCartItems, useCartTotal, useCartLoading } from "@/store/useCartStore";
const items = useCartItems();      // Only re-renders when items change
const total = useCartTotal();      // Only re-renders when total changes
const loading = useCartLoading();  // Only re-renders when loading changes
```

## Backend Compatibility

The backend now supports both:
- Legacy `size` field (for backward compatibility)
- New `attributes` Map (for flexible attributes)

Both formats work seamlessly. No migration needed for existing data.

## Frontend Compatibility

The frontend utilities handle both formats automatically:
- Legacy cart items with only `size` field
- New cart items with `attributes` Map

No changes needed to existing components that use the old format.

## Testing Checklist

Before removing the old store file, verify:

- [ ] Add to cart works with products that have no attributes
- [ ] Add to cart works with products that have size only
- [ ] Add to cart works with products that have color only
- [ ] Add to cart works with products that have size + color
- [ ] Cart displays all attributes correctly
- [ ] Cart item quantity updates work
- [ ] Cart item removal works
- [ ] Cart persists across app restarts

## Rollback Plan

If issues arise, you can temporarily revert by:

1. Keep both store files
2. Update imports to use `.js` file
3. Report issues for fixing

The backend changes are backward compatible, so no rollback needed there.
