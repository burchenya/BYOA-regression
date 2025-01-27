import React, { useEffect, useRef, useState } from 'react';
import { Typography, Card, CardContent, Slider, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import * as d3 from 'd3';

const medicalExamples = {
  bpAge: {
    name: 'Blood Pressure vs Age',
    data: Array.from({ length: 50 }, (_, i) => ({
      x: 20 + Math.random() * 60, // age 20-80
      y: 90 + (i / 2) + Math.random() * 30 // BP increasing with age + noise
    })),
    xLabel: 'Age (years)',
    yLabel: 'Systolic Blood Pressure (mmHg)'
  },
  heightWeight: {
    name: 'Height vs Weight',
    data: Array.from({ length: 50 }, (_, i) => ({
      x: 150 + Math.random() * 40, // height 150-190 cm
      y: 50 + (i / 3) + Math.random() * 20 // weight increasing with height + noise
    })),
    xLabel: 'Height (cm)',
    yLabel: 'Weight (kg)'
  }
};

function LinearRegression() {
  const svgRef = useRef();
  const [selectedExample, setSelectedExample] = useState('bpAge');
  const [noiseLevel, setNoiseLevel] = useState(1);
  
  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = medicalExamples[selectedExample].data.map(d => ({
      x: d.x,
      y: d.y + (Math.random() - 0.5) * noiseLevel * 20
    }));

    // Scales
    const x = d3.scaleLinear()
      .domain([d3.min(data, d => d.x) * 0.9, d3.max(data, d => d.x) * 1.1])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.y) * 0.9, d3.max(data, d => d.y) * 1.1])
      .range([height, 0]);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 40)
      .attr('fill', 'black')
      .text(medicalExamples[selectedExample].xLabel);

    svg.append('g')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -height / 2)
      .attr('fill', 'black')
      .text(medicalExamples[selectedExample].yLabel);

    // Add dots
    svg.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.x))
      .attr('cy', d => y(d.y))
      .attr('r', 5)
      .style('fill', '#69b3a2');

    // Calculate and add regression line
    const xValues = data.map(d => d.x);
    const yValues = data.map(d => d.y);
    const xMean = d3.mean(xValues);
    const yMean = d3.mean(yValues);
    const ssxx = d3.sum(xValues.map(x => Math.pow(x - xMean, 2)));
    const ssxy = d3.sum(data.map(d => (d.x - xMean) * (d.y - yMean)));
    const slope = ssxy / ssxx;
    const intercept = yMean - slope * xMean;

    const line = d3.line()
      .x(d => x(d))
      .y(d => y(slope * d + intercept));

    svg.append('path')
      .datum(x.domain())
      .attr('fill', 'none')
      .attr('stroke', 'red')
      .attr('stroke-width', 2)
      .attr('d', line);

  }, [selectedExample, noiseLevel]);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Linear Regression in Medical Research
      </Typography>
      
      <Typography variant="body1" paragraph>
        Linear regression helps us understand the relationship between two continuous variables.
        It's commonly used in medical research to predict outcomes or understand correlations between measurements.
      </Typography>

      <Card className="interactive-controls">
        <CardContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Example Dataset</InputLabel>
            <Select
              value={selectedExample}
              onChange={(e) => setSelectedExample(e.target.value)}
              label="Example Dataset"
            >
              {Object.entries(medicalExamples).map(([key, example]) => (
                <MenuItem key={key} value={key}>{example.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography gutterBottom>Noise Level</Typography>
          <Slider
            value={noiseLevel}
            onChange={(_, value) => setNoiseLevel(value)}
            min={0}
            max={2}
            step={0.1}
            marks
            valueLabelDisplay="auto"
          />
        </CardContent>
      </Card>

      <div className="visualization-container">
        <svg ref={svgRef}></svg>
      </div>

      <Typography variant="h6" gutterBottom>
        Key Concepts
      </Typography>
      
      <Typography variant="body1" paragraph>
        • The red line represents the best fit line through the data points
      </Typography>
      <Typography variant="body1" paragraph>
        • Each point represents a single patient's measurements
      </Typography>
      <Typography variant="body1" paragraph>
        • The noise level slider demonstrates how variation in measurements can affect our ability to see patterns
      </Typography>
    </div>
  );
}

export default LinearRegression; 