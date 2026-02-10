/**
 * OrderSearch Component - Instacar Shopper Order Management
 * Demonstrates real-time order search with advanced filtering capabilities
 *
 * Optimizations implemented:
 * - Fuse.js for fuzzy search with error tolerance
 * - Lodash debounce for search input performance
 * - Hierarchical grouping by order status
 * - Performance monitoring
 */

import React, {useState, useMemo, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Fuse from 'fuse.js';
import debounce from 'lodash.debounce';

// Order type definition
interface Order {
  id: string;
  clientCount: number;
  paymentAmount: number;
  storeName: string;
  status: 'pending' | 'in_progress' | 'completed';
  timestamp: Date;
  items: number;
}

// Hierarchical grouping structure
interface OrderGroup {
  status: string;
  statusLabel: string;
  orders: Order[];
  count: number;
}

// Performance metrics
interface PerformanceMetrics {
  lastSearchTime: number;
  totalSearches: number;
  averageSearchTime: number;
}

// Mock order data generator
const generateMockOrders = (): Order[] => {
  const stores = [
    'Walmart',
    'Target',
    'Costco',
    'Kroger',
    'Whole Foods',
    'Safeway',
  ];
  const statuses: Order['status'][] = ['pending', 'in_progress', 'completed'];
  const orders: Order[] = [];

  for (let i = 1; i <= 50; i++) {
    orders.push({
      id: `ORD-${String(i).padStart(4, '0')}`,
      clientCount: Math.floor(Math.random() * 4) + 1, // 1-4 clients
      paymentAmount: parseFloat((Math.random() * 200 + 50).toFixed(2)),
      storeName: stores[Math.floor(Math.random() * stores.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      items: Math.floor(Math.random() * 30) + 5,
    });
  }

  // Sort by payment amount descending (good pay first)
  return orders.sort((a, b) => b.paymentAmount - a.paymentAmount);
};

const OrderSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [minPayment, setMinPayment] = useState<number>(0);
  const [showGrouped, setShowGrouped] = useState<boolean>(true);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics>({
      lastSearchTime: 0,
      totalSearches: 0,
      averageSearchTime: 0,
    });

  const orders = useMemo(() => generateMockOrders(), []);

  // Fuse.js configuration for fuzzy search
  const fuseOptions = useMemo(
    () => ({
      keys: ['id', 'storeName'],
      threshold: 0.3, // Lower = more strict, Higher = more fuzzy
      includeScore: true,
      minMatchCharLength: 2,
    }),
    [],
  );

  const fuse = useMemo(
    () => new Fuse(orders, fuseOptions),
    [orders, fuseOptions],
  );

  // Debounced search query update
  const debouncedSetQuery = useRef(
    debounce((query: string) => {
      setDebouncedQuery(query);
    }, 300),
  ).current;

  useEffect(() => {
    debouncedSetQuery(searchQuery);
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [searchQuery, debouncedSetQuery]);

  // Real-time filtering with performance tracking
  const filteredOrders = useMemo(() => {
    const startTime = performance.now();

    let result: Order[];

    // Use Fuse.js for fuzzy search if query exists
    if (debouncedQuery.trim()) {
      const fuseResults = fuse.search(debouncedQuery);
      result = fuseResults.map(r => r.item);
    } else {
      result = orders;
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      result = result.filter(order => order.status === selectedStatus);
    }

    // Apply payment filter
    result = result.filter(order => order.paymentAmount >= minPayment);

    const endTime = performance.now();
    const searchTime = endTime - startTime;

    // Update performance metrics
    setPerformanceMetrics(prev => {
      const newTotal = prev.totalSearches + 1;
      const newAverage =
        (prev.averageSearchTime * prev.totalSearches + searchTime) / newTotal;
      return {
        lastSearchTime: searchTime,
        totalSearches: newTotal,
        averageSearchTime: newAverage,
      };
    });

    return result;
  }, [orders, debouncedQuery, selectedStatus, minPayment, fuse]);

  // Hierarchical grouping by status
  const groupedOrders = useMemo(() => {
    if (!showGrouped) {
      return null;
    }

    const groups: OrderGroup[] = [
      {status: 'pending', statusLabel: 'Pendiente', orders: [], count: 0},
      {status: 'in_progress', statusLabel: 'En Progreso', orders: [], count: 0},
      {status: 'completed', statusLabel: 'Completado', orders: [], count: 0},
    ];

    filteredOrders.forEach(order => {
      const group = groups.find(g => g.status === order.status);
      if (group) {
        group.orders.push(order);
        group.count++;
      }
    });

    // Return only groups with orders
    return groups.filter(g => g.count > 0);
  }, [filteredOrders, showGrouped]);

  const renderOrder = ({item}: {item: Order}) => {
    const isGoodPay = item.paymentAmount >= 100;

    return (
      <TouchableOpacity style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>{item.id}</Text>
          <Text style={[styles.paymentBadge, isGoodPay && styles.goodPayBadge]}>
            ${item.paymentAmount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.orderDetails}>
          <Text style={styles.storeName}>{item.storeName}</Text>
          <Text style={styles.orderInfo}>
            {item.clientCount} cliente{item.clientCount > 1 ? 's' : ''} •{' '}
            {item.items} artículos
          </Text>
          <Text style={styles.timestamp}>
            {item.timestamp.toLocaleDateString()}{' '}
            {item.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={[styles.status, styles[`status_${item.status}`]]}>
            {item.status === 'pending'
              ? 'Pendiente'
              : item.status === 'in_progress'
              ? 'En Progreso'
              : 'Completado'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupHeader = ({item}: {item: OrderGroup}) => {
    return (
      <View style={styles.groupHeader}>
        <Text style={styles.groupHeaderText}>
          {item.statusLabel} ({item.count})
        </Text>
      </View>
    );
  };

  const renderGroupedOrder = ({item}: {item: Order | OrderGroup}) => {
    // Check if item is a group header
    if ('statusLabel' in item) {
      return renderGroupHeader({item: item as OrderGroup});
    }
    return renderOrder({item: item as Order});
  };

  // Flatten grouped orders for FlatList
  const flattenedData = useMemo(() => {
    if (!groupedOrders) {
      return filteredOrders;
    }

    const flattened: (Order | OrderGroup)[] = [];
    groupedOrders.forEach(group => {
      flattened.push(group); // Add group header
      flattened.push(...group.orders); // Add orders in group
    });
    return flattened;
  }, [groupedOrders, filteredOrders]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Instacar Shopper - Búsqueda de Órdenes</Text>

      {/* Performance Metrics */}
      {performanceMetrics.totalSearches > 0 && (
        <View style={styles.metricsContainer}>
          <Text style={styles.metricsText}>
            Búsqueda: {performanceMetrics.lastSearchTime.toFixed(2)}ms |
            Promedio: {performanceMetrics.averageSearchTime.toFixed(2)}ms
          </Text>
        </View>
      )}

      {/* Quick Search with debounce */}
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por ID o tienda... (búsqueda inteligente)"
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#999"
      />
      {searchQuery !== debouncedQuery && (
        <Text style={styles.debounceIndicator}>Buscando...</Text>
      )}

      {/* Filters */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Estado:</Text>
        <View style={styles.filterButtons}>
          {['all', 'pending', 'in_progress'].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                selectedStatus === status && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedStatus(status)}>
              <Text
                style={[
                  styles.filterButtonText,
                  selectedStatus === status && styles.filterButtonTextActive,
                ]}>
                {status === 'all'
                  ? 'Todos'
                  : status === 'pending'
                  ? 'Pendiente'
                  : 'En Progreso'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Payment Filter */}
      <View style={styles.paymentFilter}>
        <Text style={styles.filterLabel}>Pago mínimo:</Text>
        <View style={styles.paymentButtons}>
          {[0, 75, 100, 150].map(amount => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.paymentButton,
                minPayment === amount && styles.paymentButtonActive,
              ]}
              onPress={() => setMinPayment(amount)}>
              <Text
                style={[
                  styles.paymentButtonText,
                  minPayment === amount && styles.paymentButtonTextActive,
                ]}>
                ${amount}+
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Grouping Toggle */}
      <View style={styles.groupingContainer}>
        <Text style={styles.filterLabel}>Vista:</Text>
        <TouchableOpacity
          style={[
            styles.groupingButton,
            showGrouped && styles.groupingButtonActive,
          ]}
          onPress={() => setShowGrouped(!showGrouped)}>
          <Text
            style={[
              styles.groupingButtonText,
              showGrouped && styles.groupingButtonTextActive,
            ]}>
            {showGrouped ? '📊 Agrupado por Estado' : '📋 Lista Simple'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <Text style={styles.resultsCount}>
        {filteredOrders.length} órdenes encontradas
      </Text>

      {/* Order List */}
      <FlatList
        data={flattenedData}
        renderItem={showGrouped ? renderGroupedOrder : renderOrder}
        keyExtractor={(item, _index) => {
          if ('statusLabel' in item) {
            return `group-${item.status}`;
          }
          return (item as Order).id;
        }}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={true}
        // Performance optimization for large lists
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0074DF',
    marginBottom: 15,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#0074DF',
    borderColor: '#0074DF',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  paymentFilter: {
    marginBottom: 15,
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  paymentButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  paymentButtonText: {
    color: '#666',
    fontSize: 14,
  },
  paymentButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentBadge: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  goodPayBadge: {
    backgroundColor: '#4CAF50',
    color: '#fff',
  },
  orderDetails: {
    marginBottom: 10,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  status: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  status_pending: {
    backgroundColor: '#FFF3CD',
    color: '#856404',
  },
  status_in_progress: {
    backgroundColor: '#D1ECF1',
    color: '#0C5460',
  },
  status_completed: {
    backgroundColor: '#D4EDDA',
    color: '#155724',
  },
  groupHeader: {
    backgroundColor: '#0074DF',
    padding: 12,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 8,
  },
  groupHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricsContainer: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  metricsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  debounceIndicator: {
    fontSize: 12,
    color: '#0074DF',
    fontStyle: 'italic',
    marginTop: -10,
    marginBottom: 10,
  },
  groupingContainer: {
    marginBottom: 15,
  },
  groupingButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  groupingButtonActive: {
    backgroundColor: '#0074DF',
    borderColor: '#0074DF',
  },
  groupingButtonText: {
    color: '#666',
    fontSize: 14,
  },
  groupingButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default OrderSearch;
