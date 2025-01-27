import React, { useEffect, useRef, useState } from 'react';
import { Typography, Card, CardContent, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import * as d3 from 'd3';

const medicalExamples = {
  cancerSurvival: {
    name: 'Cancer Treatment Survival',
    data: Array.from({ length: 100 }, () => {
      const age = 40 + Math.random() * 40;
      const stage = Math.floor(Math.random() * 4) + 1;
      // Survival time decreases with age and stage
      const baseTime = 60 - (age/10) - (stage * 6);
      const survivalTime = Math.max(1, baseTime + Math.random() * 20);
      const censored = Math.random() > 0.3; // 30% censoring rate
      return { age, stage, survivalTime, censored };
    }).sort((a, b) => a.survivalTime - b.survivalTime),
    xLabel: 'Time (months)',
    yLabel: 'Survival Probability'
  },
  heartFailure: {
    name: 'Heart Failure Progression',
    data: Array.from({ length: 100 }, () => {
      const ejectionFraction = 20 + Math.random() * 40;
      const nyhaClass = Math.floor(Math.random() * 4) + 1;
      // Time to event decreases with lower EF and higher NYHA class
      const baseTime = 48 - (40-ejectionFraction)/2 - (nyhaClass * 4);
      const eventTime = Math.max(1, baseTime + Math.random() * 15);
      const censored = Math.random() > 0.25; // 25% censoring rate
      return { ejectionFraction, nyhaClass, eventTime: eventTime, censored };
    }).sort((a, b) => a.eventTime - b.eventTime),
    xLabel: 'Time (months)',
    yLabel: 'Event-free Probability'
  }
};

function calculateKaplanMeier(data) {
  let n = data.length;
  let survival = [];
  let currentProb = 1;
  
  data.forEach((d, i) => {
    if (!d.censored) {
      currentProb *= (n - 1) / n;
    }
    survival.push({
      time: d.survivalTime || d.eventTime,
      probability: currentProb,
      censored: d.censored
    });
    n--;
  });
  
  return survival;
}

function CoxRegression() {
  const svgRef = useRef();
  const [selectedExample, setSelectedExample] = useState('cancerSurvival');
  
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

    const data = medicalExamples[selectedExample].data;
    const survivalData = calculateKaplanMeier(data);
    
    // Scales
    const x = d3.scaleLinear()
      .domain([0, d3.max(survivalData, d => d.time)])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, 1])
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

    // Add survival curve
    const line = d3.line()
      .x(d => x(d.time))
      .y(d => y(d.probability));

    svg.append('path')
      .datum(survivalData)
      .attr('fill', 'none')
      .attr('stroke', '#2c3e50')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add censored points
    svg.selectAll('circle')
      .data(survivalData.filter(d => d.censored))
      .enter()
      .append('circle')
      .attr('cx', d => x(d.time))
      .attr('cy', d => y(d.probability))
      .attr('r', 4)
      .style('fill', '#e74c3c');

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 150}, 20)`);

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 0)
      .attr('y2', 0)
      .style('stroke', '#2c3e50')
      .style('stroke-width', 2);

    legend.append('circle')
      .attr('cx', 10)
      .attr('cy', 20)
      .attr('r', 4)
      .style('fill', '#e74c3c');

    legend.append('text')
      .attr('x', 30)
      .attr('y', 4)
      .text('Survival curve');

    legend.append('text')
      .attr('x', 30)
      .attr('y', 24)
      .text('Censored');

  }, [selectedExample]);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Cox Proportional Hazards Regression
      </Typography>
      
      <Typography variant="body1" paragraph>
        Cox regression analyzes time-to-event data, accounting for censored observations.
        It's widely used in clinical trials and survival analysis.
      </Typography>

      <Card className="interactive-controls">
        <CardContent>
          <FormControl fullWidth>
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
        </CardContent>
      </Card>

      <div className="visualization-container">
        <svg ref={svgRef}></svg>
      </div>

      <Typography variant="h6" gutterBottom>
        Key Concepts
      </Typography>
      
      <Typography variant="body1" paragraph>
        • The survival curve shows probability of survival over time
      </Typography>
      <Typography variant="body1" paragraph>
        • Red dots indicate censored observations (lost to follow-up)
      </Typography>
      <Typography variant="body1" paragraph>
        • The curve steps down at each event (death/occurrence)
      </Typography>
      <Typography variant="body1" paragraph>
        • Cox regression can compare survival between groups
      </Typography>
      <Typography variant="body1" paragraph>
        • The model assumes proportional hazards over time
      </Typography>
    </div>
  );
}

export default CoxRegression; 