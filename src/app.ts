interface Validatable{
    value:string|number
    required?:boolean
    minLength?:number
    maxLength?:number
    min?:number
    max?:number
}

function autobind(_target:any,_methodName:string,descriptor:PropertyDescriptor){
    const originalMethod=descriptor.value
    const adjDescriptor:PropertyDescriptor={
        configurable:true,
        get(){
            const boundFn=originalMethod.bind(this)
            return boundFn
        }
    }
    return adjDescriptor
}

    function validate(InputElement:Validatable){
    let isValid=true
    if(InputElement.required){
        isValid=isValid && InputElement.value.toString().trim().length!==0
    }
    if(InputElement.minLength && typeof InputElement.value==="string"){
        isValid=isValid && InputElement.value.length>=InputElement.minLength
    }
    if(InputElement.maxLength && typeof InputElement.value==="string"){
        isValid=isValid && InputElement.value.length<=InputElement.maxLength
    }
    if(InputElement.min && typeof InputElement.value==="number"){
        isValid=isValid && InputElement.value>=InputElement.min
    }
    if(InputElement.max && typeof InputElement.value==="number"){
        isValid=isValid && InputElement.value<=InputElement.max
    }
    return isValid
}

enum ProjectStatus{
    Active,Finished
}

class Project{
    constructor( public id:string, public title:string,public description:string, public people:number, public status:ProjectStatus){
    }
}

type Listener=(items:Project[])=>void

class ProjectState{
    public projects:Project[]=[]
    static instance:ProjectState
    public listeners:Listener[]=[]

    static getInstance(){
        if(this.instance) return this.instance
        this.instance=new ProjectState()
        return this.instance
    }
    addProjects(title:string,description:string,people:number){
        const newProject=new Project(Math.random().toString(),title,description,people,ProjectStatus.Active)
        this.projects.push(newProject)
        this.updateListeners()
    }
    moveProject(id:string,newStatus:ProjectStatus){
        const proj=this.projects.find(proj => proj.id===id)
        if(proj && proj.status!==newStatus){
            proj.status=newStatus
            this.updateListeners()
        }
    }
    private updateListeners(){
        for(const listenerFn of this.listeners){
            listenerFn(this.projects.slice())
        }
    }
    addListeners(listenerFn:Listener){
        this.listeners.push(listenerFn)
    }
}

const state=ProjectState.getInstance()

abstract class Component<T extends HTMLElement,U extends HTMLElement>{
    templateElement:HTMLTemplateElement
    hostElement:T
    element:U
    constructor(templateId:string,hostElementId:string,insertAtStart:boolean,newElementId?:string){
        this.templateElement=document.getElementById(templateId)! as HTMLTemplateElement
        this.hostElement=document.getElementById(hostElementId)! as T
        const importedNode=document.importNode(this.templateElement.content,true)
        this.element=importedNode.firstElementChild as U
        if(newElementId){
            this.element.id=newElementId
        }
        this.attach(insertAtStart)
    }

    private attach(start:boolean){
        this.hostElement.insertAdjacentElement(start?"afterbegin":'beforeend',this.element)
    }
    abstract configure():void
    abstract renderContent():void
}

interface Draggable{
    dragStartHandler(event:DragEvent):void
    dragEndHandler(event:DragEvent):void
}
interface DropTarget{
    dragOverHandler(event:DragEvent):void
    dropHandler(event:DragEvent):void
    dragLeaveHandler(event:DragEvent):void
}

class ProjectItem extends Component<HTMLUListElement,HTMLLIElement> implements Draggable{
    private project:Project
    get persons(){
        if(this.project.people===1){
            return '1 person'
        }
        return `${this.project.people} people`
    }
    constructor(hostId:string,project:Project){
        super('single-project',hostId,false,project.id)
        this.project=project
        this.configure()
        this.renderContent()
    }
    configure(){
        this.element.addEventListener('dragstart',this.dragStartHandler)
        this.element.addEventListener('dragend',this.dragEndHandler)
    }
    renderContent(){
        this.element.querySelector('h2')!.textContent = this.project.title;
        this.element.querySelector('h3')!.textContent = this.persons + " assigned";
        this.element.querySelector('p')!.textContent = this.project.description;
    }
    @autobind
    dragEndHandler(){
    }
    @autobind
    dragStartHandler(event:DragEvent){
        event.dataTransfer!.setData('text/plain',this.project.id)
        event.dataTransfer!.effectAllowed='move'
    }
}

class ProjectList extends Component<HTMLDivElement,HTMLElement> implements DropTarget{
    assignedProjects:Project[]

    constructor(private type:'active'|'finished'){
        super('project-list','app',false,`${type}-projects`)   
        this.assignedProjects=[]
        this.renderContent()
        this.configure()
        state.addListeners((projects:Project[])=>{
            const relevantProjects = projects.filter(prj => {
                if (this.type === 'active') {
                  return prj.status === ProjectStatus.Active;
                }
                return prj.status === ProjectStatus.Finished;
              });
              this.assignedProjects = relevantProjects;
              this.renderProjects();
            })
    }
    private renderProjects(){
        const listId=document.getElementById(`${this.type}-project-list`)! as HTMLUListElement
        listId.innerHTML=""
        for(const prjItem of this.assignedProjects){
            new ProjectItem(this.element.querySelector('ul')!.id, prjItem)
        }
    }
    renderContent(){
        const listId=`${this.type}-project-list`
        this.element.querySelector("ul")!.id=listId
        this.element.querySelector("h2")!.innerText=`${this.type.toUpperCase()} PROJECTS`
    }
    @autobind
    dragOverHandler(event:DragEvent){
        event.preventDefault()
        if(event.dataTransfer && event.dataTransfer.types[0]==='text/plain'){
            const list=this.element.querySelector('ul')!
            list.classList.add('droppable')
        }
    }
    @autobind
    dragLeaveHandler(){
        const list=this.element.querySelector('ul')!
        list.classList.remove('droppable')
    }
    @autobind
    dropHandler(event:DragEvent){
        const projId=event.dataTransfer!.getData('text/plain')
        state.moveProject(projId,this.type==='active'?ProjectStatus.Active:ProjectStatus.Finished)
    }

    configure(){
        this.element.addEventListener('dragover',this.dragOverHandler)
        this.element.addEventListener('dragleave',this.dragLeaveHandler)
        this.element.addEventListener('drop',this.dropHandler)
    }
}

class ProjectInput extends Component<HTMLDivElement,HTMLFormElement>{
    titleInputElement:HTMLInputElement
    descriptionInputElement:HTMLInputElement
    peopleInputElement:HTMLInputElement
    

    constructor(){
        super('project-input','app',true,'user-input')
        this.titleInputElement=document.querySelector("#title")! as HTMLInputElement
        this.descriptionInputElement=document.querySelector("#description")! as HTMLInputElement
        this.peopleInputElement=document.querySelector("#people")! as HTMLInputElement
        this.configure()
    }

    private getUserInput():[string,string,number]|void{
        const enteredTitle=this.titleInputElement.value
        const enteredDescription=this.descriptionInputElement.value
        const enteredPeople=this.peopleInputElement.value

        const titleValidatable:Validatable={
            value:enteredTitle,
            required:true,
            minLength:3
        }
        const DescriptionValidatable:Validatable={
            value:enteredDescription,
            required:true,
            minLength:5
        }
        const PeopleValidatable:Validatable={
            value:+enteredPeople,
            required:true,
            min:1,
            max:6
        }

        if(validate(titleValidatable) && validate(DescriptionValidatable) && validate(PeopleValidatable)){
            return[enteredTitle,enteredDescription,+enteredPeople]
        }
        else{
            alert("Please enter valid input")
            return;
        }
    }
    
    @autobind
    private submitHandler(e:Event){
        e.preventDefault()
        const userInput=this.getUserInput()
        if(Array.isArray(userInput)){
            const [title,description,people]=userInput
            state.addProjects(title,description,people)
            this.clearInputs()
        }
    }
    private clearInputs(){
        this.titleInputElement.value=""
        this.descriptionInputElement.value=""
        this.peopleInputElement.value=""
    }
    renderContent(){}
    configure(){
        this.element.addEventListener("submit",this.submitHandler)
    }
}

const projectInput=new ProjectInput()
const activeProjects=new ProjectList('active')
const finishedProjects=new ProjectList('finished')
