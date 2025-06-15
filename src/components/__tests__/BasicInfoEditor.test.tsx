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
  tags: ['test'],
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

  it('should include both sharp and flat key options', () => {
    render(
      <BasicInfoEditor 
        chart={sampleChart} 
        onUpdate={mockOnUpdate} 
      />
    );
    
    // Check for sharp keys
    expect(screen.getByText('C#')).toBeInTheDocument();
    expect(screen.getByText('D#')).toBeInTheDocument();
    expect(screen.getByText('F#')).toBeInTheDocument();
    expect(screen.getByText('G#')).toBeInTheDocument();
    expect(screen.getByText('A#')).toBeInTheDocument();
    
    // Check for flat keys
    expect(screen.getByText('D♭')).toBeInTheDocument();
    expect(screen.getByText('E♭')).toBeInTheDocument();
    expect(screen.getByText('G♭')).toBeInTheDocument();
    expect(screen.getByText('A♭')).toBeInTheDocument();
    expect(screen.getByText('B♭')).toBeInTheDocument();
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