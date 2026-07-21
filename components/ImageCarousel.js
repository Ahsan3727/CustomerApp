import { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors, Radius } from '../theme';

const { width } = Dimensions.get('window');
const AUTO_SCROLL_INTERVAL = 3000;

export default function ImageCarousel({ banners, onBannerPress }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const intervalRef = useRef(null);

  const startAutoScroll = () => {
    stopAutoScroll();
    intervalRef.current = setInterval(() => {
      if (banners.length <= 1) return;
      const nextIndex = (activeIndex + 1) % banners.length;
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setActiveIndex(nextIndex);
    }, AUTO_SCROLL_INTERVAL);
  };

  const stopAutoScroll = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    startAutoScroll();
    return stopAutoScroll;
  }, [activeIndex, banners.length]);

  const onScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setActiveIndex(index);
  };

  if (!banners || banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onTouchStart={stopAutoScroll}
        onTouchEnd={startAutoScroll}
      >
        {banners.map((banner, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.9}
            onPress={() => onBannerPress && onBannerPress(banner, index)}
          >
            <Image
              source={{ uri: banner.imageUrl }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {banners.length > 1 && (
        <View style={styles.dotContainer}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    marginHorizontal: 16,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.basilLight,   // subtle tint in case image hasn't loaded
  },
  bannerImage: {
    width: width - 32,
    height: 150,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Colors.apricot,
    width: 16,
    height: 6,
    borderRadius: 3,
  },
});