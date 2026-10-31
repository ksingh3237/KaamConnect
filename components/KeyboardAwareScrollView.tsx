// A ScrollView that keeps the text box being typed in above the keyboard.
//
// Android draws edge-to-edge (RN 0.86 / Expo 57), so the window no longer shrinks when the keyboard opens and a box near
// the bottom of a long form ends up behind it. While the keyboard is up this adds its height as bottom padding (so there
// is room to scroll) and scrolls just far enough to show the focused box with a small gap. Tapping another box while
// the keyboard is already open does the same. Where the window does still resize, the padding is only spare room.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, TextInput, type GestureResponderEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewProps } from 'react-native';

/** Space left between the bottom of the box and the top of the keyboard. */
const GAP = 24;
/** Lets the padding render (and the box take focus, after a tap) before measuring. */
const SETTLE_MS = Platform.OS === 'ios' ? 250 : 120;

export const KeyboardAwareScrollView = forwardRef<ScrollView, ScrollViewProps>(function KeyboardAwareScrollView(
  { contentContainerStyle, onScroll, onTouchEnd, scrollEventThrottle, keyboardShouldPersistTaps = 'handled', children, ...rest },
  ref,
) {
  const scroll = useRef<ScrollView>(null);
  useImperativeHandle(ref, () => scroll.current as ScrollView, []);
  const offsetY = useRef(0);
  /** Top edge of the keyboard on screen; null while it is closed. */
  const keyboardTop = useRef<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const reveal = useCallback(() => {
    const top = keyboardTop.current;
    const input = TextInput.State.currentlyFocusedInput();
    if (top === null || !input) return;
    input.measureInWindow((_x, y, _width, height) => {
      const hidden = y + height + GAP - top;
      if (hidden > 0) scroll.current?.scrollTo({ y: offsetY.current + hidden, animated: true });
    });
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      keyboardTop.current = e.endCoordinates.screenY;
      setKeyboardHeight(e.endCoordinates.height);
      timers.push(setTimeout(reveal, SETTLE_MS));
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      keyboardTop.current = null;
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
      timers.forEach(clearTimeout);
    };
  }, [reveal]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetY.current = e.nativeEvent.contentOffset.y;
    onScroll?.(e);
  };

  // A tap on another box while the keyboard is open: no new keyboard event comes, so check after the tap lands
  const handleTouchEnd = (e: GestureResponderEvent) => {
    if (keyboardTop.current !== null) setTimeout(reveal, SETTLE_MS);
    onTouchEnd?.(e);
  };

  return (
    <ScrollView
      ref={scroll}
      {...rest}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      contentContainerStyle={[contentContainerStyle, keyboardHeight > 0 && { paddingBottom: keyboardHeight + GAP }]}
      onScroll={handleScroll}
      scrollEventThrottle={scrollEventThrottle ?? 16}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </ScrollView>
  );
});
