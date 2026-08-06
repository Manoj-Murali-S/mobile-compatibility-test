import { useState, useCallback, useEffect } from 'react';

export interface UseKeyboardNavigationResult {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  selectCurrent: () => void;
  moveUp: () => void;
  moveDown: () => void;
  reset: () => void;
}

/**
 * Hook for managing keyboard navigation (arrow keys, Enter, Escape)
 * @param itemCount - Total number of items to navigate
 * @param onSelect - Callback when Enter is pressed
 * @param onEscape - Callback when Escape is pressed
 * @returns Navigation state and handlers
 */
export function useKeyboardNavigation(
  itemCount: number,
  onSelect?: (index: number) => void,
  onEscape?: () => void
): UseKeyboardNavigationResult {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Move up through items
  const moveUp = useCallback(() => {
    setSelectedIndex(prev => {
      if (prev <= 0) return itemCount - 1;
      return prev - 1;
    });
  }, [itemCount]);

  // Move down through items
  const moveDown = useCallback(() => {
    setSelectedIndex(prev => {
      if (prev >= itemCount - 1) return 0;
      return prev + 1;
    });
  }, [itemCount]);

  // Select current item
  const selectCurrent = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < itemCount && onSelect) {
      onSelect(selectedIndex);
    }
  }, [selectedIndex, itemCount, onSelect]);

  // Reset selection
  const reset = useCallback(() => {
    setSelectedIndex(-1);
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveDown();
          break;
        case 'Enter':
          e.preventDefault();
          selectCurrent();
          break;
        case 'Escape':
          e.preventDefault();
          if (onEscape) onEscape();
          break;
        default:
          break;
      }
    },
    [moveUp, moveDown, selectCurrent, onEscape]
  );

  // Reset selection when item count changes
  useEffect(() => {
    if (selectedIndex >= itemCount) {
      setSelectedIndex(-1);
    }
  }, [itemCount, selectedIndex]);

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    selectCurrent,
    moveUp,
    moveDown,
    reset,
  };
}
