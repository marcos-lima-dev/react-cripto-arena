import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Search,
  ChevronUp, ChevronDown, X
} from 'lucide-react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const formatPrice = (value) => {
  const numberFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return numberFormatter.format(value);
};

const CryptoList = () => {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'market_cap',
    direction: 'desc'
  });
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  const COINGECKO_API = 'https://api.coingecko.com/api/v3';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${COINGECKO_API}/coins/markets?vs_currency=brl&order=market_cap_desc&per_page=100&page=1&sparkline=false`
        );
        setCryptos(response.data);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Falha ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchChartData = async (id, period) => {
    setChartLoading(true);
    try {
      const days = period.replace('d', '');
      const response = await axios.get(
        `${COINGECKO_API}/coins/${id}/market_chart?vs_currency=brl&days=${days}`
      );
      
      const formattedData = response.data.prices.map(([timestamp, price]) => ({
        date: new Date(timestamp).toLocaleDateString(),
        price: price
      }));
      
      setChartData(formattedData);
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico:', error);
    } finally {
      setChartLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleCryptoClick = async (crypto) => {
    setSelectedCrypto(crypto);
    setModalOpen(true);
    await fetchChartData(crypto.id, selectedPeriod);
  };

  const getDisplayedCryptos = () => {
    let filtered = [...cryptos];
    
    if (search) {
      filtered = filtered.filter(crypto =>
        crypto.name.toLowerCase().includes(search.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  };

  const DetailModal = () => {
    if (!modalOpen || !selectedCrypto) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl w-full h-full md:h-auto md:w-[90%] lg:max-w-4xl md:max-h-[90vh] overflow-y-auto">
          <div className="border-b border-gray-700 px-3 py-2 md:p-4 flex justify-between items-center sticky top-0 bg-gray-800">
            <div className="flex items-center gap-2 md:gap-3">
              <img src={selectedCrypto.image} alt={selectedCrypto.name} className="w-6 h-6 md:w-8 md:h-8" />
              <div>
                <h2 className="text-base md:text-xl font-bold text-white">{selectedCrypto.name}</h2>
                <span className="text-xs md:text-sm text-gray-400 uppercase">{selectedCrypto.symbol}</span>
              </div>
            </div>
            <button 
              onClick={() => setModalOpen(false)}
              className="p-1 hover:bg-gray-700 rounded-full"
            >
              <X className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
            </button>
          </div>

          <div className="p-3 md:p-6">
            <div className="flex justify-between mb-4 md:mb-6">
              {['24h', '7d', '30d', '90d'].map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setSelectedPeriod(period);
                    fetchChartData(selectedCrypto.id, period);
                  }}
                  className={`px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm rounded-lg transition-colors flex-1 mx-1 ${
                    selectedPeriod === period
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
              <div className="bg-gray-700/50 p-2 md:p-4 rounded-lg">
                <p className="text-xs md:text-sm text-gray-400 mb-1">Preço</p>
                <p className="text-sm md:text-lg font-bold text-white truncate">
                  R$ {formatPrice(selectedCrypto.current_price)}
                </p>
              </div>
              <div className="bg-gray-700/50 p-2 md:p-4 rounded-lg">
                <p className="text-xs md:text-sm text-gray-400 mb-1">24h</p>
                <p className={`text-sm md:text-lg font-bold ${
                  selectedCrypto.price_change_percentage_24h > 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {selectedCrypto.price_change_percentage_24h.toFixed(2)}%
                </p>
              </div>
              <div className="bg-gray-700/50 p-2 md:p-4 rounded-lg">
                <p className="text-xs md:text-sm text-gray-400 mb-1">Volume</p>
                <p className="text-sm md:text-lg font-bold text-white truncate">
                  R$ {formatPrice(selectedCrypto.total_volume)}
                </p>
              </div>
              <div className="bg-gray-700/50 p-2 md:p-4 rounded-lg">
                <p className="text-xs md:text-sm text-gray-400 mb-1">Cap.</p>
                <p className="text-sm md:text-lg font-bold text-white truncate">
                  R$ {formatPrice(selectedCrypto.market_cap)}
                </p>
              </div>
            </div>

            <div className="bg-gray-700/30 rounded-lg p-2 md:p-4">
              {chartLoading ? (
                <div className="h-[200px] md:h-[400px] flex items-center justify-center">
                  <p className="text-sm text-gray-400">Carregando...</p>
                </div>
              ) : (
                <div className="h-[200px] md:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF"
                        fontSize={10}
                        tickFormatter={(value) => value.split('/')[0]}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={10}
                        width={60}
                        tickFormatter={(value) => `R$ ${formatPrice(value)}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '12px',
                          padding: '8px'
                        }}
                        formatter={(value) => [`R$ ${formatPrice(value)}`, 'Preço']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#34D399" 
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && cryptos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-base md:text-xl">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 px-2 py-2 md:p-6">
      <div className="max-w-6xl mx-auto bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
        <div className="border-b border-gray-700 p-3 md:p-4">
          <div className="space-y-3 md:space-y-0 md:flex md:justify-between md:items-center">
            <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text text-center md:text-left">
              Crypto Arena
            </h1>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cripto..."
                className="w-full md:w-64 pl-8 pr-3 py-1.5 text-sm bg-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 p-2 md:p-4 border-b border-gray-700 text-xs md:text-sm text-gray-400">
          <div>Nome</div>
          <div>Preço</div>
          <div className="text-right">24h %</div>
          <div className="hidden md:block text-right">Cap. Mercado</div>
        </div>

        <div className="divide-y divide-gray-700">
          {getDisplayedCryptos().map((crypto) => (
            <div
              key={crypto.id}
              onClick={() => handleCryptoClick(crypto)}
              className="grid grid-cols-3 md:grid-cols-4 gap-2 p-2 md:p-4 hover:bg-gray-700/50 transition-all cursor-pointer items-center"
            >
              <div className="flex items-center gap-2">
                <img src={crypto.image} alt={crypto.name} className="w-5 h-5 md:w-6 md:h-6" />
                <div>
                  <div className="hidden md:block text-sm text-gray-100">{crypto.name}</div>
                  <div className="text-xs uppercase text-gray-400">{crypto.symbol}</div>
                </div>
              </div>

              <div className="text-gray-100 text-xs md:text-sm truncate">
                R$ {formatPrice(crypto.current_price)}
              </div>

              <div className="flex items-center justify-end gap-1">
                {crypto.price_change_percentage_24h > 0 ? (
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
                )}
                <span className={`text-xs md:text-sm ${
                  crypto.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                </span>
              </div>

              <div className="hidden md:block text-right text-gray-100 text-sm">
                R$ {formatPrice(crypto.market_cap)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DetailModal />
    </div>
  );
};

export default CryptoList;