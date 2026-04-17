
    import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { QuestionTemplate } from '../interface/QuestionTemplate';
import { Questions } from '../interface/Questions';
import { CategoryService } from '../service/category.service';
import { CategoryDetails } from '../interface/CategoryDetails';
import { QuestionsService } from '../service/questions.service';
import { ToastService } from '../service/toast.service';

@Component({
  selector: 'app-questionnairetemplates',
  imports: [ReactiveFormsModule, NgClass, CommonModule, FormsModule],
  templateUrl: './questionnairetemplates.component.html',
  styleUrl: './questionnairetemplates.component.css'
})
export class QuestionnairetemplatesComponent {
  searchTerm: string = '';
  templateName: string = '';
  templateId: number = 0;
  questionId: number = 0;
  questionIndex: number = 0;
  
  questionTemplateForm: FormGroup;
  errorMsg: string | null = null;
  errorStatus: boolean = false;
  successMsg: string | null = null;
  successStatus: boolean = false;

  btnName = "Create";
  status: boolean = false;
  typeStatus: string = "Non-Basic";

  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  showToastFlag: boolean = false;
  tempStatus: string = "SAVED";

  private modalRef: NgbModalRef | null = null;

  questionComponent: Questions[] = [];
  categories: CategoryDetails[] = [];

  templates: QuestionTemplate[] = [];
  questionTemplate: QuestionTemplate | null = null;

  constructor(private fb: FormBuilder, private categoryService: CategoryService, private questionsService: QuestionsService, private modalService: NgbModal, private toast: ToastService) {        
      this.questionTemplateForm = this.fb.group({
        id : new FormControl(''),
        categoryName:new FormControl('', [Validators.required]),
        name:new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]),
        type :new FormControl('Non-Basic'),
        addDetails:new FormControl(''),
        status:new FormControl('')
      });
  }  

  ngOnInit() {
    this.questionsService.currentQuestionData.subscribe(data => {
        if (data) {
          this.questionTemplateForm.patchValue(data); // Assuming you use Reactive Forms
          this.btnName = "Update";
        }
    });
    this.questionComponent = [
      {
        id: 0, index: 1, question: '', benchmark: '', information: '', createdBy: '', details: '',  observation: '', entryDate: '', status: true },
      { id: 0, index: 2, question: '', benchmark: '', information: '', createdBy: '', entryDate: '', details: '',  observation: '', status: true }
    ]; 
    this.getQuestionsDetails(); // Initial load 
    this.getCategoryDetails(); // Initial load 

  }

  getQuestionsDetails() {
    this.questionsService.getQuestionDetails().subscribe({
      next: (data) => {
        this.templates = data.sort((a, b) => a.name.localeCompare(b.name));
        console.log('Templates:', this.templates);
      },
      error: (err) => {
        this.toast.show('Failed to fetch templates'+ err, 'error');
        console.error('Failed to fetch templates', err);
      }
    });
  }

  getCategoryDetails() {
    this.categoryService.getCategoryDetails().subscribe({
      next: (data) => {
        this.categories = data.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
        console.log('Categories:', this.categories);
      },
      error: (err) => {
        this.toast.show('Failed to fetch categories'+ err, 'error');
        console.error('Failed to fetch categories', err);
      }
    });
  }

  get totalTemplates() {
    return this.templates.length;
  }

  get totalQuestions() {
    return this.templates.reduce((sum, template) => sum + template.questions, 0);
  }

  get totalBasicTemplates() {
    return this.templates.filter(t => t.type === "Basic").length;
  }

  get totalNonBasicTemplates() {
    return this.templates.filter(t => t.type !== "Basic").length;
  }

  filteredTemplates() {
    if (!this.searchTerm) return this.templates;
    return this.templates.filter(t =>
      t.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Button Actions
  addQuestionTemplate(questionTemplate: QuestionTemplate) {
    if (!this.questionTemplateForm.value.categoryName) {
      this.toast.show("Please select a category.", 'error');
      return;
    }
    if (!this.questionTemplateForm.value.name) {
      this.toast.show("Please enter a template name.", 'error');
      return;
    }
    if (this.questionComponent.length === 0) {
      this.toast.show("Add at least one question to create the template.", 'error');
      return;
    }
    if (this.questionComponent.some(fc => !fc.question)) {
      this.toast.show("All question fields are required. Question must be filled or the entry should be removed.", 'error');
      return;
    }

    console.log(this.questionTemplateForm.value);
    console.log(this.questionComponent);

    this.questionTemplate = {
      id: this.questionTemplateForm.value.id,
      category: this.questionTemplateForm.value.categoryName,
      categoryName: this.questionTemplateForm.value.categoryName,
      name: this.questionTemplateForm.value.name,
      questions: this.questionComponent.length + 1,
      type: this.typeStatus,
      status: this.tempStatus,
      questionsList: this.questionComponent,
      createdBy: '', // Add current user if available
      createdAt: new Date().toISOString()
    };
    console.log(this.questionTemplate);
    

    this.questionsService.saveQuestionDetails(this.questionTemplate).subscribe(response => {
    console.log("Question template saved successfully!", response);
    this.toast.show('Question Template added successfully!', 'success');
    this.questiontemplateReset();
    this.getQuestionsDetails()
   
    this.modalRef?.close();
    }, error => {
      this.toast.show("Error saving fee structure:"+error, 'error');
    }); 
  }
  viewTemplate(content: any, id: number) {
    const template = this.templates.find(t => t.id === id);
    if (!template) return;

    this.questionTemplate = template;
    this.questionComponent = template.questionsList || [];

    this.toggleStatus(template.type === "Non-Basic");
    this.modalRef = this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false });
  }

  editTemplate(content: any, id: number) {
    const template = this.templates.find(t => t.id === id);
    if (!template) return;

    this.questionTemplate = template;
    this.questionComponent = template.questionsList || [];

    this.btnName = "Update";
    this.tempStatus = "EDITED";

    // OPEN MODAL FIRST
    this.modalRef = this.modalService.open(content, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    this.toggleStatus(template.type === "Non-Basic");
    // THEN PATCH THE FORM
    this.questionTemplateForm.patchValue({
      id: template.id,
      categoryName: template.category, // ensures category selection works
      name: template.name,
      type: template.type,
      status: template.status
    });
  }

  openModal(content: any, templateId: number, templateName: string) {
    this.templateName = templateName;
    this.templateId = templateId;

    this.modalRef = this.modalService.open(content, { centered: true });
  }

  deleteTemplate(id: number, modalId: string) {
      console.log('Deleting Template', id);
      this.deleteQuestionTemplate(id);
      this.templates = this.templates.filter(x => x.id !== id);
      this.modalRef?.close();
  }
  
  deleteQuestionTemplate(id:number) {
    console.log(":::::::::::::::::"+id);
    this.questionsService.deleteQuestionDetails(id).subscribe({
      next: (data) => {
        console.log('Response ::', data);
        this.toast.show("Question template deleted successfully.", 'success');
      },
      error: (err) => {
        console.error('Unable to delete category ::', err);
        this.toast.show("Unable to delete category :"+err, 'error');
      }
    });
  }


  createModal(content: any) {
    console.log(":::::::::::::::");
    this.questiontemplateReset();
    this.btnName = "Create";
    this.modalRef = this.modalService.open(content, { size : 'xl' ,   backdrop: 'static', keyboard: false});
  }

  questiontemplateReset() {
    this.questionTemplateForm.reset();
    this.tempStatus = "SAVED";
    this.btnName = "Create";
    this.questionComponent = [
      {
        id: 0, index: 1, question: '', benchmark: '', information: '', createdBy: '', details: '',  observation: '', entryDate: '', status: true },
      { id: 0, index: 2, question: '', benchmark: '', information: '', createdBy: '', details: '',  observation: '', entryDate: '', status: true }
    ]; 
  }

  addQuestion() {
    const newComponent: Questions = {
      id: 0,
      index: this.questionComponent.length + 1,
      question: '',
      benchmark: '',
      information: '',
      createdBy: '',
      entryDate: '',
      details: '',
      observation: '',
      status: true
    };
    this.questionComponent.push(newComponent);
  }

  removeQuestions(content: any, id: number, index: number) {
    this.questionId = id;
    this.questionIndex = index;
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  deleteQuestion(id: number, index: number, content: any) {
      console.log("ID :::::::::::::::::"+id);
      if(id !== 0) {
        this.questionsService.deleteQuestion(id).subscribe({
          next: (data) => {
            console.log('Response ::', data);
            this.toast.show("Question deleted successfully.",'success');
            this.questionComponent = this.questionComponent.filter(component => component.id !== id);
          },
          error: (err) => {
            console.error('Unable to delete category ::', err);
            this.toast.show("Unable to delete category :"+err, 'error');
          }
        });
      } else {
        console.log("Question not saved yet, removing locally.");
        this.questionComponent = this.questionComponent.filter(component => component.index !== index);
        this.toast.show("Question deleted successfully.",'success');
      }
     
      this.modalRef?.close();
  }


  toggleStatus(status: boolean) {
      status = !status;
      this.typeStatus = status ? "Basic" : "Non-Basic";
      this.status = status;
      return status;
  }

  printPDF() {

    const printContents = document.getElementById('printSection')!.innerHTML;

    const generatedBy = this.questionTemplate?.createdBy ?? "Unknown User";           
    const generatedFrom = "QCMT App";        
    const generatedDate = new Date().toLocaleString();
   
    const popupWin = window.open('', '_blank', 'width=850,height=1100');

    popupWin!.document.open();
    popupWin!.document.write(`
      <html>
        <head>
          <title>Print</title>

          <style>

            /* ------------------------- */
            /* PAGE SETTINGS             */
            /* ------------------------- */
            @page {
                size: A4 portrait;
                margin: 15mm;

                /* Page number on every page */
                @bottom-center {
                    content: "Page " counter(page);
                    font-size: 12px;
                }
            }

            body {
                font-family: Arial, sans-serif;
                background: #fff !important;
                width: 190mm;
                margin: 0 auto;
            }

            /* ------------------------- */
            /* TABLE FIXES               */
            /* ------------------------- */
            table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;   
            }

            th, td {
                border: 1px solid #000;
                padding: 6px;
                vertical-align: top;
                word-wrap: break-word;
                overflow-wrap: break-word;

                /* Reduce row splitting */
                page-break-inside: avoid;
                break-inside: avoid;
            }

            th {
                background: #f0f0f0;
                text-align: center;
            }
                                
            .title-print {
                text-align: center;
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 10px;
            }

            /* --------------------------------------------- */
            /* PAGE NUMBER FALLBACK (for browsers not using 
                 @bottom-center)
            /* --------------------------------------------- */
            .page-number {
                display: none;
                text-align: center;
                font-size: 12px;
                margin-top: 10px;
            }

            @media print {
                .page-number {
                    display: block;
                    page-break-after: always;
                }
            }

            /* --------------------------------------------- */
            /* FOOTER ONLY ON LAST PAGE                      */
            /* --------------------------------------------- */
            .footer {
                margin-top: 40px;
                padding-top: 8px;
                border-top: 1px solid #000;
                font-size: 12px;
                text-align: center;
                page-break-after: avoid;
            }

          </style>
        </head>

        <body>

            ${printContents}

            <!-- FOOTER: Only prints once at the END -->
            <div class="footer">
                <div>PDF Generated Date: <b>${generatedDate}</b></div>
                <div>Created By: <b>${generatedBy}</b></div>
                <div>Generated From: <b>${generatedFrom}</b></div>
            </div>

            <!-- fallback page numbers -->
            <div class="page-number"></div>

        </body>
      </html>
    `);

    popupWin!.document.close();

    setTimeout(() => {
        popupWin!.print();
        popupWin!.close();
    }, 500);
  }

  searchText = '';
  page = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20];

  get filteredData() {
    const search = this.searchText.toLowerCase();
    return this.templates.filter(template =>
      template.name.toLowerCase().includes(search)
    );
  }
  

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  get visiblePages(): number[] {
    const pagesToShow = 5;
    const half = Math.floor(pagesToShow / 2);
    let start = Math.max(1, this.page - half);
    let end = Math.min(this.totalPages, start + pagesToShow - 1);

    // Adjust start if fewer pages on the right
    if (end - start < pagesToShow - 1) {
      start = Math.max(1, end - pagesToShow + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(p: number) {
    this.page = p;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  nextPage() {
    if (this.page < this.totalPages) this.page++;
  }
}