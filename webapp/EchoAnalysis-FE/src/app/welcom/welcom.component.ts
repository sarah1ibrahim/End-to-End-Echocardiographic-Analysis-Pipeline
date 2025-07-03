import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FileService } from '../services/file.service'; // Adjust path as needed

@Component({
  selector: 'app-welcom',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './welcom.component.html',
  styleUrl: './welcom.component.css'
})
export class WelcomComponent implements AfterViewInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  selectedImage: string | null = null;
  patientId: string = '';
  isLoading:boolean=false
  constructor(private router: Router, private _fileService: FileService) {
    console.log('WelcomComponent constructor called');
  }

  ngOnInit() {
    console.log('WelcomComponent ngOnInit called');
  }

  ngAfterViewInit() {
    // console.log('WelcomComponent ngAfterViewInit called, fileInput:', this.fileInput);
  }

  onUploadClick() {
    console.log('Upload button clicked');
    if (this.fileInput && this.fileInput.nativeElement) {
      console.log('File input found, triggering click');
      this.fileInput.nativeElement.click();
    } else {
      // console.error('File input not found with ViewChild', this.fileInput);
    }
  }

  onFileSelected(event: any) {
    console.log('File selected event:', event);
    console.log('Selected file:', event.target.files[0]);
    const file = event.target.files[0];
    this.selectedImage = URL.createObjectURL(file);
    if (file) {
      this._fileService.setFile(file); // Store file in service
      
    } else {
      console.error('No file selected');
    }
  }
  goToNextPage():void{
    this.isLoading=true
    console.log("navigateToSegmentation",this._fileService.navigateToSegmentation)
    if(this._fileService.navigateToSegmentation){
      console.log("inside if")
      this.isLoading=true
      this.router.navigate(['/home/segmentation']); 
    }
    

  }
}