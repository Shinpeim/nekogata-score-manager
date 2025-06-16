import { describe, it, expect, beforeEach } from 'vitest';
import { useChartDataStore } from '../chartDataStore';
import { createNewChordChart } from '../../utils/chordCreation';

describe('chartDataStore', () => {
  beforeEach(() => {
    useChartDataStore.setState({
      charts: {},
      currentChartId: null
    });
  });

  describe('basic data operations', () => {
    it('should set charts', () => {
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      const chart2 = createNewChordChart({ title: 'Chart 2' });
      const charts = { [chart1.id]: chart1, [chart2.id]: chart2 };

      const { setCharts } = useChartDataStore.getState();
      setCharts(charts);

      const state = useChartDataStore.getState();
      expect(state.charts).toEqual(charts);
    });

    it('should set current chart', () => {
      const chartId = 'test-chart-id';

      const { setCurrentChart } = useChartDataStore.getState();
      setCurrentChart(chartId);

      const state = useChartDataStore.getState();
      expect(state.currentChartId).toBe(chartId);
    });

    it('should add chart to data', () => {
      const chart = createNewChordChart({ title: 'Test Chart' });

      const { addChartToData } = useChartDataStore.getState();
      addChartToData(chart);

      const state = useChartDataStore.getState();
      expect(state.charts[chart.id]).toEqual(chart);
    });

    it('should update chart in data', () => {
      const chart = createNewChordChart({ title: 'Original Title' });
      const updatedChart = { ...chart, title: 'Updated Title' };

      const { addChartToData, updateChartInData } = useChartDataStore.getState();
      
      addChartToData(chart);
      updateChartInData(chart.id, updatedChart);

      const state = useChartDataStore.getState();
      expect(state.charts[chart.id].title).toBe('Updated Title');
    });

    it('should remove chart from data', () => {
      const chart = createNewChordChart({ title: 'Chart to Remove' });

      const { addChartToData, removeChartFromData, setCurrentChart } = useChartDataStore.getState();
      
      addChartToData(chart);
      setCurrentChart(chart.id);
      removeChartFromData(chart.id);

      const state = useChartDataStore.getState();
      expect(state.charts[chart.id]).toBeUndefined();
      expect(state.currentChartId).toBeNull();
    });

    it('should preserve current chart if not deleted', () => {
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      const chart2 = createNewChordChart({ title: 'Chart 2' });

      const { addChartToData, removeChartFromData, setCurrentChart } = useChartDataStore.getState();
      
      addChartToData(chart1);
      addChartToData(chart2);
      setCurrentChart(chart1.id);
      removeChartFromData(chart2.id);

      const state = useChartDataStore.getState();
      expect(state.currentChartId).toBe(chart1.id);
    });

    it('should remove multiple charts from data', () => {
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      const chart2 = createNewChordChart({ title: 'Chart 2' });
      const chart3 = createNewChordChart({ title: 'Chart 3' });

      const { addChartToData, removeMultipleChartsFromData, setCurrentChart } = useChartDataStore.getState();
      
      addChartToData(chart1);
      addChartToData(chart2);
      addChartToData(chart3);
      setCurrentChart(chart1.id);
      
      removeMultipleChartsFromData([chart1.id, chart2.id]);

      const state = useChartDataStore.getState();
      expect(state.charts[chart1.id]).toBeUndefined();
      expect(state.charts[chart2.id]).toBeUndefined();
      expect(state.charts[chart3.id]).toBeDefined();
      expect(state.currentChartId).toBe(chart3.id);
    });
  });

  describe('utility methods', () => {
    it('should get current chart', () => {
      const chart = createNewChordChart({ title: 'Current Chart' });

      const { addChartToData, setCurrentChart, getCurrentChart } = useChartDataStore.getState();
      
      addChartToData(chart);
      setCurrentChart(chart.id);

      const currentChart = getCurrentChart();
      expect(currentChart).toEqual(chart);
    });

    it('should return null for current chart when none selected', () => {
      const { getCurrentChart } = useChartDataStore.getState();
      
      const currentChart = getCurrentChart();
      expect(currentChart).toBeNull();
    });

    it('should get chart by id', () => {
      const chart = createNewChordChart({ title: 'Test Chart' });

      const { addChartToData, getChartById } = useChartDataStore.getState();
      
      addChartToData(chart);

      const foundChart = getChartById(chart.id);
      expect(foundChart).toEqual(chart);
    });

    it('should return null for non-existent chart id', () => {
      const { getChartById } = useChartDataStore.getState();
      
      const foundChart = getChartById('non-existent-id');
      expect(foundChart).toBeNull();
    });

    it('should get charts array', () => {
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      const chart2 = createNewChordChart({ title: 'Chart 2' });

      const { addChartToData, getChartsArray } = useChartDataStore.getState();
      
      addChartToData(chart1);
      addChartToData(chart2);

      const chartsArray = getChartsArray();
      expect(chartsArray).toHaveLength(2);
      expect(chartsArray).toContain(chart1);
      expect(chartsArray).toContain(chart2);
    });

    it('should check if has charts', () => {
      const { hasCharts, addChartToData } = useChartDataStore.getState();
      
      expect(hasCharts()).toBe(false);

      const chart = createNewChordChart({ title: 'Test Chart' });
      addChartToData(chart);

      expect(hasCharts()).toBe(true);
    });

    it('should get charts count', () => {
      const { getChartsCount, addChartToData } = useChartDataStore.getState();
      
      expect(getChartsCount()).toBe(0);

      const chart1 = createNewChordChart({ title: 'Chart 1' });
      const chart2 = createNewChordChart({ title: 'Chart 2' });
      
      addChartToData(chart1);
      expect(getChartsCount()).toBe(1);
      
      addChartToData(chart2);
      expect(getChartsCount()).toBe(2);
    });
  });
});