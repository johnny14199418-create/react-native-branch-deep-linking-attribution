/**
 * OrderSearch Component - Instacar Shopper Order Management
 * Demonstrates real-time order search with filtering capabilities
 */

import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

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
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [minPayment, setMinPayment] = useState<number>(0);

  const orders = useMemo(() => generateMockOrders(), []);

  // Real-time filtering
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.storeName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === 'all' || order.status === selectedStatus;

      const matchesPayment = order.paymentAmount >= minPayment;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchQuery, selectedStatus, minPayment]);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Instacar Shopper - Búsqueda de Órdenes</Text>

      {/* Quick Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por ID o tienda..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#999"
      />

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

      {/* Results Count */}
      <Text style={styles.resultsCount}>
        {filteredOrders.length} órdenes encontradas
      </Text>

      {/* Order List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={true}
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
});

export default OrderSearch;
