import { useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import ChordChart from './components/ChordChart';
import { useChordChartStore } from './stores/chordChartStore';

function App() {
  const loadInitialData = useChordChartStore(state => state.loadInitialData);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return (
    <MainLayout>
      <ChordChart />
    </MainLayout>
  );
}

export default App;
