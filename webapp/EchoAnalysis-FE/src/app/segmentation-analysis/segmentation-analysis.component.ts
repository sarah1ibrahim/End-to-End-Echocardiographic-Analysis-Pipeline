import { Component, ViewChild, ElementRef, OnInit, HostListener, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FileService } from '../services/file.service';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { MeasurementPanelComponent } from '../measurement-panel/measurement-panel.component';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Interface } from 'node:readline';


interface IMeasurements {
  EF: string;
  EDV: string;
  ESV: string;
  SV: string;
  MV: string;
  BV: string;
  interpretation: string;
}

interface Ipatient {
  id: number
  cardiologistId: number
  first_name: string
  last_name: string
  Bdate: string
  sex: string
  phone: string
  weight: number
  height: number
  createdAt: string
  updatedAt: string
}


@Component({
  selector: 'app-segmentation-analysis',
  standalone: true,
  imports: [MeasurementPanelComponent, FormsModule,CommonModule,RouterModule],
  templateUrl: './segmentation-analysis.component.html',
  styleUrls: ['./segmentation-analysis.component.css']
})


export class SegmentationAnalysisComponent implements OnInit {

  patientData!:Ipatient
  measurementRawData!:IMeasurements
  // measurementData = [
  //   { label: 'GLS(Avg)', value: '-15.00 %' },
  //   { label: 'RV Diameter', value: '3.5 cm' },
  //   { label: 'LV Diameter', value: '4.6 cm' },
  //   { label: 'IAS', value: '-15.00 %' },
  //   { label: 'LV Mass Index', value: '-1727.79 g/m' },
  // ];
  measurementData :{ label: string; value: string }[] = [];
  

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('originalImage') originalImage!: ElementRef<HTMLImageElement>;
  @ViewChild('segmentedImage') segmentedImage!: ElementRef<HTMLImageElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('segmentedCanvas') segmentedCanvasRef!: ElementRef<HTMLCanvasElement>;

  selectedImage: string | null = null;
  secondSelectedFrame: string | null = null;
  patientId: string = '';
  isLoading: boolean = false;
  isLoaded!: boolean;
  uploadErrorMsg: string = '';
  originalImageUrl: SafeUrl | null = null;
  secondSelectedFrameUrl: SafeUrl | null = null;
  segmentedImageUrl!: string;
  segmentedImageUrl2!: string;
  error: string | null = null;
  selectedFile: File | null = null;
  secondFrameFile: File | null = null;
  

  showClinicalModal:boolean=false
  checkSeconedNextBtn:boolean=false
  showSegViewer:boolean=false


  // Transform states for original image
  originalZoomLevel = 1;
  originalRotation = 0;
  originalPanX = 0;
  originalPanY = 0;
  originalIsDragging = false;
  originalStartX = 0;
  originalStartY = 0;
  

  // Transform states for segmented image
  segmentedZoomLevel = 1;
  segmentedRotation = 0;
  segmentedPanX = 0;
  segmentedPanY = 0;
  segmentedIsDragging = false;
  segmentedStartX = 0;
  segmentedStartY = 0;

  private readonly _fileService = inject(FileService);

  
  private ctx!: CanvasRenderingContext2D;
  private segmentedCtx!: CanvasRenderingContext2D;
  canvasInitialized = false;
  segmentedCanvasInitialized = false;
  
  private startPoint: { x: number, y: number } | null = null;
  isMeasuring: boolean = false;
  endPoint: { x: number, y: number } | null = null;
  private pixelSpacing = 0.1;
  mode: 'measure' | 'pan' = 'pan';
  activeCanvas: 'original' | 'segmented' | null = null;

  measurementCalc:boolean=false

  //data that will be send to the header:
  // static for now 
  name:string='Ali Ahmed Omar'
  age:string="32"
  sex:string='male'
  date:string='18 May 2024, 11:07 AM'
  indication:string='Atrial fibrillation with ventricular rates'
    
  
  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
  ) {}

  // measurement tool functions
  ngAfterViewChecked() {
    if (!this.canvasInitialized && this.canvasRef) {
      const canvas = this.canvasRef.nativeElement;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      this.ctx = canvas.getContext('2d')!;
      this.canvasInitialized = true;
      console.log('Original canvas initialized');

      canvas.addEventListener('mousedown', this.startMeasuring.bind(this));
      canvas.addEventListener('mousemove', this.updateMeasuring.bind(this));
      canvas.addEventListener('mouseup', this.endMeasuring.bind(this));
    }

    if (!this.segmentedCanvasInitialized && this.segmentedCanvasRef) {
      const segmentedCanvas = this.segmentedCanvasRef.nativeElement;
      segmentedCanvas.width = segmentedCanvas.offsetWidth;
      segmentedCanvas.height = segmentedCanvas.offsetHeight;
      this.segmentedCtx = segmentedCanvas.getContext('2d')!;
      this.segmentedCanvasInitialized = true;
      console.log('Segmented canvas initialized');

      segmentedCanvas.addEventListener('mousedown', this.startMeasuring.bind(this));
      segmentedCanvas.addEventListener('mousemove', this.updateMeasuring.bind(this));
      segmentedCanvas.addEventListener('mouseup', this.endMeasuring.bind(this));
    }
  }

  startMeasuring(event: MouseEvent) {
    if (this.mode !== 'measure') return;

    const target = event.target as HTMLElement;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let zoomLevel: number;

    if (target === this.canvasRef?.nativeElement) {
      this.activeCanvas = 'original';
      canvas = this.canvasRef.nativeElement;
      ctx = this.ctx;
      zoomLevel = this.originalZoomLevel;
    } else if (target === this.segmentedCanvasRef?.nativeElement) {
      this.activeCanvas = 'segmented';
      canvas = this.segmentedCanvasRef.nativeElement;
      ctx = this.segmentedCtx;
      zoomLevel = this.segmentedZoomLevel;
    } else {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    this.startPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    this.isMeasuring = true;
  }

  updateMeasuring(event: MouseEvent) {
    if (!this.isMeasuring || !this.startPoint || !this.activeCanvas) return;

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let zoomLevel: number;

    if (this.activeCanvas === 'original') {
      canvas = this.canvasRef.nativeElement;
      ctx = this.ctx;
      zoomLevel = this.originalZoomLevel;
    } else {
      canvas = this.segmentedCanvasRef.nativeElement;
      ctx = this.segmentedCtx;
      zoomLevel = this.segmentedZoomLevel;
    }

    const rect = canvas.getBoundingClientRect();
    this.endPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    const { x: x1, y: y1 } = this.startPoint;
    const { x: x2, y: y2 } = this.endPoint;

    const distancePx = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const distanceRealPx = distancePx / zoomLevel;
    const distanceCm = distanceRealPx * this.pixelSpacing;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawMeasurement(ctx, x1, y1, x2, y2, `${distanceCm.toFixed(1)} cm`);
  }

  endMeasuring(event: MouseEvent) {
    this.isMeasuring = false;
    this.startPoint = null;
    this.endPoint = null;
    this.activeCanvas = null;
  }

  drawMeasurement(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, label: string) {
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.font = '16px Arial';
    ctx.fillStyle = '#00ffcc';

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    this.drawArrowhead(ctx, x1, y1, x2, y2);
    this.drawArrowhead(ctx, x2, y2, x1, y1);

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 10;
    ctx.fillText(label, midX, midY);
  }

  drawArrowhead(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(toX, toY);
    ctx.fill();
  }

  toggleMode() {
    this.mode = this.mode === 'measure' ? 'pan' : 'measure';
    console.log('Mode toggled to:', this.mode);
  }


  

  //______________________________________________________________________________________________________________
   ngOnInit(): void {
    const file = this._fileService.getFile();
    console.log('File from FileService:', file?.name); // Print file for debugging
    if (file) {
      this.selectedFile=file
      this.loadImages(file);
      // console.log('selectedFile',this.selectedFile);
      this._fileService.clearFile(); // Clear after use
    } else {
      this.error = 'No image file received. Please upload an image from the welcome page.';
      console.log('No file in FileService',this.selectedFile);
    }

    
  }

  
    onUploadClick() {
    console.log('Upload button clicked');
    if (this.fileInput && this.fileInput.nativeElement) {
      console.log('File input found, triggering click');
      this.fileInput.nativeElement.click();
    } else {
      console.error('File input not found with ViewChild', this.fileInput);
    }
  }

  onFileSelected(event: any) {
    console.log('File selected event:', event);
    console.log('Selected file:', event.target.files[0]);
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      // console.log(`File details: name=${file.name}, type=${file.type}, size=${file.size} bytes`);
      
      
      if (this.showClinicalModal) {
      this.secondFrameFile = file;
      this.secondSelectedFrame = URL.createObjectURL(file);
    } else {
      this.selectedFile = file;
      this.selectedImage = URL.createObjectURL(file);
    }
      
      // this._fileService.setFile(file);
      

      
    }
  }

  
  goToNextPage():void{
    this.isLoading=true
    if(this.selectedFile){
      this.loadImages(this.selectedFile);
      // this.isLoading=false
      
    }
    // if(this.showClinicalModal){
      // this.measurementCalc=true
      // this.showClinicalModal = false
    // }

    
    // if(!this.isLoading){
    //   this.checkSeconedNextBtn=true
    // }
    
    // console.log("navigateToSegmentation",this._fileService.navigateToSegmentation)
    // if(this._fileService.navigateToSegmentation){
    //   console.log("inside if")
    //   this.isLoading=true
      // this.router.navigate(['/home/segmentation']); 
    // }
    

  }
  backToViewers():void{
    if(this.secondFrameFile){
      
      this.checkSeconedNextBtn = true

      this.loadImages(this.secondFrameFile);
      console.log("secondFrameFile",this.secondFrameFile)
      console.log("firstFrameFile",this.selectedFile)
      this.measurementCalc=true

    }
  }


  loadImages(file: File) {
    console.log('selectedFile',this.selectedFile);
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if(this.secondFrameFile){
      this._fileService.uploadAndMeasure(this.secondFrameFile,this.patientId).subscribe({
        next:(response)=>{
          console.log("Upload successful in uploadAndMeasure",response)
          this.segmentedImageUrl2=response.newSegmentedImageUrl
          this.measurementRawData=response.measurementParameters
          console.log("measurementRawData.mv")
          this.measurementData = [
              { label: 'EF', value: this.measurementRawData.EF  },
              { label: 'EDV', value: this.measurementRawData.EDV },
              { label: 'ESV', value: this.measurementRawData.ESV },
              { label: 'SV', value: this.measurementRawData.SV},
              { label: 'MV', value: this.measurementRawData.MV },
              { label: 'BV', value: this.measurementRawData.BV },
              { label: 'Interpretation', value: this.measurementRawData.interpretation }
            ];
            this.showClinicalModal = false
            this.checkSeconedNextBtn = false
            // this.showSegViewer=true


        },
        error:(error)=>{
          console.log("error in uploadAndMeasure ",error)
          this.checkSeconedNextBtn = false
        }
      })

    }
    else{
      if (this.selectedFile && this.patientId){
      console.log("inside loadImages func")
      this._fileService.uploadPatientFile(this.selectedFile,this.patientId).subscribe({
      
        next:(response)=>{
          
          console.log('Upload successful', response)
          console.log('segmentedUrl', response.segmentedUrl)
          console.log('patientInfo', response.patient)
          this.patientData=response.patient
          
          this.segmentedImageUrl=response.segmentedUrl
          console.log('this.segmentedImageUrl', response.segmentedUrl)
          setTimeout(() => {
            this.showSegViewer=true
            this.isLoaded = true;
            this.isLoading=false
            console.log('isLoaded set to true after delay');
          }, 1500);
          
          
        },
        error:(err:HttpErrorResponse)=>{
          this.error = err.error.message;
          console.error('Upload error', err.error.message);
          this.isLoading=false
          // this.uploadErrorMsg=err.error.message
          this.showError(err.error.message)
        }
        
      })
    }
    }
    if (!validTypes.includes(file.type)) {
      this.error = 'Please upload a valid image file (JPEG, PNG, or GIF).';
      this.originalImageUrl = null;
      return;
    }
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if(this.secondFrameFile){
        this.secondSelectedFrameUrl = this.sanitizer.bypassSecurityTrustUrl(e.target?.result as string);
        console.error('imageUrl2', this.secondSelectedFrameUrl);
      
      }
      else{
        this.originalImageUrl = this.sanitizer.bypassSecurityTrustUrl(e.target?.result as string);
        console.error('imageUrl', this.originalImageUrl);

      }
      this.error = null;
      this.resetOriginalTransform();
      this.resetSegmentedTransform();
    };
    reader.readAsDataURL(file);

  }



  // Original Image Tools
  zoomInOriginal() {
    this.originalZoomLevel += 0.1;
    this.updateOriginalTransform();
    
  }
  

  zoomOutOriginal() {
    this.originalZoomLevel = Math.max(0.1, this.originalZoomLevel - 0.1);
    this.updateOriginalTransform();
  }

  rotateOriginal() {
    this.originalRotation += 90;
    this.updateOriginalTransform();
  }

  resetOriginalTransform() {
    this.originalZoomLevel = 1;
    this.originalRotation = 0;
    this.originalPanX = 0;
    this.originalPanY = 0;
    this.updateOriginalTransform();
    if (this.canvasInitialized && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    }
  }

  updateOriginalTransform() {
    const transform = `scale(${this.originalZoomLevel}) rotate(${this.originalRotation}deg) translate(${this.originalPanX}px, ${this.originalPanY}px)`;
    if (this.originalImage) {
      this.originalImage.nativeElement.style.transform = transform;
    }
  }

  // Segmented Image Tools
  zoomInSegmented() {
    this.segmentedZoomLevel += 0.1;
    this.updateSegmentedTransform();
  }

  zoomOutSegmented() {
    this.segmentedZoomLevel = Math.max(0.1, this.segmentedZoomLevel - 0.1);
    this.updateSegmentedTransform();
  }

  rotateSegmented() {
    this.segmentedRotation += 90;
    this.updateSegmentedTransform();
  }

  resetSegmentedTransform() {
    this.segmentedZoomLevel = 1;
    this.segmentedRotation = 0;
    this.segmentedPanX = 0;
    this.segmentedPanY = 0;
    this.updateSegmentedTransform();
    if (this.segmentedCanvasInitialized && this.segmentedCtx) {
      this.segmentedCtx.clearRect(0, 0, this.segmentedCanvasRef.nativeElement.width, this.segmentedCanvasRef.nativeElement.height);
    }
  }

  updateSegmentedTransform() {
    const transform = `scale(${this.segmentedZoomLevel}) rotate(${this.segmentedRotation}deg) translate(${this.segmentedPanX}px, ${this.segmentedPanY}px)`;
    if (this.segmentedImage) {
      this.segmentedImage.nativeElement.style.transform = transform;
    }
  }

  @HostListener('document:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (this.mode !== 'pan') return;
    const target = event.target as HTMLElement;
    if (target.closest('.original-image-section')) {
      this.originalIsDragging = true;
      this.originalStartX = event.clientX - this.originalPanX;
      this.originalStartY = event.clientY - this.originalPanY;
    } else if (target.closest('.segmented-image-section')) {
      this.segmentedIsDragging = true;
      this.segmentedStartX = event.clientX - this.segmentedPanX;
      this.segmentedStartY = event.clientY - this.segmentedPanY;
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.originalIsDragging) {
      this.originalPanX = event.clientX - this.originalStartX;
      this.originalPanY = event.clientY - this.originalStartY;
      this.updateOriginalTransform();
    } else if (this.segmentedIsDragging) {
      this.segmentedPanX = event.clientX - this.segmentedStartX;
      this.segmentedPanY = event.clientY - this.segmentedStartY;
      this.updateSegmentedTransform();
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.originalIsDragging = false;
    this.segmentedIsDragging = false;
  }


  showError(msg: string) {
  this.uploadErrorMsg = msg;
  setTimeout(() => {
    this.uploadErrorMsg = '';
  }, 5000); // Hide after 4 seconds
} 

openClinicalAnalysisModal() {
    this.showClinicalModal = true;
  }

toggleMeasurementCalc():void{
  this.measurementCalc=true
}

closeModal() {
  this.showClinicalModal = false;
  // this.selectedImage = null;
}
calcBirthDate(Bdate: string): number {
  const birthDate = new Date(Bdate);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    years--;
  }
  return years;
}
}

