import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import {
  getAllMeasurements,
  deleteMeasurement,
  clearAllMeasurements,
} from '../services/storage/historyStorage';
import { exportHistoryCsv } from '../services/export/csvExporter';

export const HistoryScreen = ({ onSelectMeasurement, onCompareRooms }) => {
  const [measurements, setMeasurements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isCompareMode, setIsCompareMode] = useState(false);

  const loadData = async () => {
    const list = await getAllMeasurements();
    setMeasurements(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Measurement',
      `Are you sure you want to delete "${item.roomName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMeasurement(item.id);
            loadData();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Records',
      'This will remove all saved room acoustic measurements.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllMeasurements();
            loadData();
          },
        },
      ]
    );
  };

  const toggleSelectForCompare = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 2) {
        Alert.alert('Comparison Limit', 'Select exactly 2 rooms to compare.');
        return;
      }
      const next = [...selectedIds, id];
      setSelectedIds(next);
      if (next.length === 2 && onCompareRooms) {
        const roomA = measurements.find((m) => m.id === next[0]);
        const roomB = measurements.find((m) => m.id === next[1]);
        if (roomA && roomB) {
          onCompareRooms(roomA, roomB);
        }
      }
    }
  };

  const filtered = measurements.filter((m) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (m.roomName || '').toLowerCase().includes(q);
    const venueMatch = (m.location?.venueName || '').toLowerCase().includes(q);
    return nameMatch || venueMatch;
  });

  const renderItem = ({ item }) => {
    const isSelected = selectedIds.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => {
          if (isCompareMode) {
            toggleSelectForCompare(item.id);
          } else {
            onSelectMeasurement(item);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardMainRow}>
          {item.photoUri ? (
            <Image source={{ uri: item.photoUri }} style={styles.thumbnail} />
          ) : (
            <View style={styles.iconPlaceholder}>
              <Ionicons name="home-outline" size={20} color={COLORS.primary} />
            </View>
          )}

          <View style={styles.infoCol}>
            <View style={styles.titleRow}>
              <Text style={styles.roomName} numberOfLines={1}>
                {item.roomName}
              </Text>
              <View style={styles.rtBadge}>
                <Text style={styles.rtBadgeText}>{item.overallRT60.toFixed(2)}s</Text>
              </View>
            </View>

            {item.location?.venueName ? (
              <View style={styles.venueRow}>
                <Ionicons name="location-sharp" size={11} color={COLORS.primary} />
                <Text style={styles.venueText} numberOfLines={1}>
                  {item.location.venueName}
                </Text>
              </View>
            ) : null}

            <View style={styles.metaRow}>
              <Text style={styles.dateText}>
                {new Date(item.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.fitText}>R² = {(item.rSquared * 100).toFixed(0)}%</Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.warmthText}>{item.interpretation?.warmth || 'neutral'}</Text>
            </View>
          </View>

          {isCompareMode ? (
            <Ionicons
              name={isSelected ? 'checkbox' : 'square-outline'}
              size={22}
              color={isSelected ? COLORS.primary : COLORS.textMuted}
            />
          ) : (
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.deleteBtn}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Audit History</Text>
            <Text style={styles.subtitle}>
              {measurements.length} saved room acoustic profile{measurements.length === 1 ? '' : 's'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.compareBtn, isCompareMode && styles.compareBtnActive]}
              onPress={() => {
                setIsCompareMode(!isCompareMode);
                setSelectedIds([]);
              }}
            >
              <Ionicons
                name="git-compare-outline"
                size={16}
                color={isCompareMode ? '#000' : COLORS.primary}
              />
              <Text style={[styles.compareBtnText, isCompareMode && { color: '#000' }]}>
                {isCompareMode ? 'Done' : 'Compare'}
              </Text>
            </TouchableOpacity>
            {measurements.length > 0 && (
              <>
                <TouchableOpacity
                  onPress={() => exportHistoryCsv(measurements)}
                  style={styles.clearBtn}
                >
                  <Ionicons name="download-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
                  <Ionicons name="trash-bin-outline" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by room or building..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {isCompareMode && (
          <View style={styles.compareBanner}>
            <Text style={styles.compareBannerText}>
              Select 2 rooms to compare reverberation decay curves: ({selectedIds.length}/2)
            </Text>
          </View>
        )}

        {/* List of Measurements */}
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Records Found</Text>
            <Text style={styles.emptySubtitle}>
              Completed room acoustic measurements will be automatically archived here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compareBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  compareBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  clearBtn: {
    padding: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
  },
  compareBanner: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  compareBannerText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: SPACING.xl,
    gap: 10,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
  },
  iconPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  rtBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rtBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  venueText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  dotSeparator: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  fitText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '600',
  },
  warmthText: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: 'capitalize',
  },
  deleteBtn: {
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: 40,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});
