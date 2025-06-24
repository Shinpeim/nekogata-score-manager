import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BasicInfoEditor from '../BasicInfoEditor';
import type { ChordChart } from '../../types';

const sampleChart: ChordChart = {
  id: 'test-chart',
  title: 'Test Song',
  artist: 'Test Artist',
  key: 'C',
  tempo: 120,
  timeSignature: '4/4',
  sections: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('BasicInfoEditor', () => {
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    mockOnUpdate.mockClear();
  });

  it('should render all form fields', () => {
    render(
      <BasicInfoEditor 
        chart={sampleChart} 
        onUpdate={mockOnUpdate} 
      />
    );

    expect(screen.getByLabelText('タイトル')).toBeInTheDocument();
    expect(screen.getByLabelText('アーティスト')).toBeInTheDocument();
    expect(screen.getByLabelText('キー')).toBeInTheDocument();
    expect(screen.getByLabelText('テンポ (BPM)')).toBeInTheDocument();
    expect(screen.getByLabelText('拍子')).toBeInTheDocument();
  });

  it('should include proper 12 keys with parallel minor keys', () => {
    render(
      <BasicInfoEditor 
        chart={sampleChart} 
        onUpdate={mockOnUpdate} 
      />
    );
    
    // Check for proper keys with parallel keys display
    expect(screen.getByText('C / Am')).toBeInTheDocument();
    expect(screen.getByText('D♭ / B♭m')).toBeInTheDocument();
    expect(screen.getByText('D / Bm')).toBeInTheDocument();
    expect(screen.getByText('E♭ / Cm')).toBeInTheDocument();
    expect(screen.getByText('E / C#m')).toBeInTheDocument();
    expect(screen.getByText('F / Dm')).toBeInTheDocument();
    expect(screen.getByText('G♭ / E♭m')).toBeInTheDocument();
    expect(screen.getByText('G / Em')).toBeInTheDocument();
    expect(screen.getByText('A♭ / Fm')).toBeInTheDocument();
    expect(screen.getByText('A / F#m')).toBeInTheDocument();
    expect(screen.getByText('B♭ / Gm')).toBeInTheDocument();
    expect(screen.getByText('B / G#m')).toBeInTheDocument();
    
    // Check that inappropriate sharp keys are not present
    expect(screen.queryByText('C#')).not.toBeInTheDocument();
    expect(screen.queryByText('D#')).not.toBeInTheDocument();
    expect(screen.queryByText('F#')).not.toBeInTheDocument();
    expect(screen.queryByText('G#')).not.toBeInTheDocument();
    expect(screen.queryByText('A#')).not.toBeInTheDocument();
  });

  it('should call onUpdate when key is changed to flat key', () => {
    render(
      <BasicInfoEditor 
        chart={sampleChart} 
        onUpdate={mockOnUpdate} 
      />
    );

    const keySelect = screen.getByLabelText('キー');
    fireEvent.change(keySelect, { target: { value: 'Bb' } });

    expect(mockOnUpdate).toHaveBeenCalledWith('key', 'Bb');
  });

  it('should call onUpdate when key is changed to Gb', () => {
    render(
      <BasicInfoEditor 
        chart={sampleChart} 
        onUpdate={mockOnUpdate} 
      />
    );

    const keySelect = screen.getByLabelText('キー');
    fireEvent.change(keySelect, { target: { value: 'Gb' } });

    expect(mockOnUpdate).toHaveBeenCalledWith('key', 'Gb');
  });

  it('should handle natural keys correctly', () => {
    render(
      <BasicInfoEditor 
        chart={sampleChart} 
        onUpdate={mockOnUpdate} 
      />
    );

    const keySelect = screen.getByLabelText('キー');
    fireEvent.change(keySelect, { target: { value: 'G' } });

    expect(mockOnUpdate).toHaveBeenCalledWith('key', 'G');
  });
});