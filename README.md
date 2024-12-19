# End-to-End Echocardiographic Analysis Pipeline

## Overview
An AI-powered system for automated assessment and reporting of heart function through echocardiographic analysis. This project streamlines diagnostic workflows, enhances assessment accuracy, and provides robust tools for patient monitoring and reporting.

## Project Goals
- Develop a comprehensive echocardiographic analysis pipeline
- Automate heart function assessment and reporting
- Improve clinical workflow efficiency
- Enable accurate patient monitoring over time

## Technical Pipeline

### 1. Segmentation
- **Supervised Learning Approach**
  - Segments myocardium and blood within heart chambers
  - Utilizes reference images for training
  
- **Unsupervised Learning Approach**
  - Alternative method for cases without image masks
  - Validation against supervised methods
  - Potential extension to additional cross-sectional views

### 2. Time Frame Detection
- Automated detection of systolic and diastolic frames
- Implements both AI and deterministic methods

### 3. Clinical Parameters Calculation
- Myocardium volume
- Cardiac blood volume
- Stroke volume
- Ejection fraction

### 4. Reporting System
- Integration of pre-trained LLM models
- Generation of structured clinical reports

## Web Application Features
- Parameter input and visualization
- Segmentation editing capabilities
- Report editing and customization
- Patient progress tracking across multiple visits

## Future Development
- Expansion of unsupervised learning techniques to additional views
- Enhancement of reporting capabilities
- Integration with existing clinical workflows

***

### Our Team
- Rana Hany Mahmoud 
- Sarah Ibrahim Abdelfattah 
- Sarah Mohamed Mohamed
- Luna Eyad
- Yasmin Tarek 












