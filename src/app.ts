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

class ProjectState{
    public projects:any[]=[]
    static instance:ProjectState
    public listeners:any[]=[]

    static getInstance(){
        if(this.instance) return this.instance
        this.instance=new ProjectState()
        return this.instance
    }
    addProjects(title:string,description:string,people:number){
        const newProject={
            id:Math.random().toString(),
            title,
            description,
            people,
        }
        this.projects.push(newProject)
        for(const listenerFn of this.listeners){
            listenerFn(this.projects.slice(this.projects.length-1))
        }
    }

    addListeners(listenerFn:Function){
        this.listeners.push(listenerFn)
    }
}

const state=ProjectState.getInstance()

class ProjectList{
    templateElement:HTMLTemplateElement
    hostElement:HTMLElement
    element:HTMLElement
    assignedProjects:any[]=[]

    constructor(private type:'active'|'finished'){
        this.templateElement=document.getElementById("project-list")! as HTMLTemplateElement
        this.hostElement=document.getElementById("app")! as HTMLElement
        const importedNode=document.importNode(this.templateElement.content,true)
        this.element=importedNode.firstElementChild as HTMLElement
        this.element.id=`${type}-projects`    
        this.attach()   
        this.renderContent()
        state.addListeners((projects:any[])=>{
            console.log({projects})
            this.assignedProjects.push(projects[0])
            this.renderProjects()
        })
    }
    private renderProjects(){
        const listId=document.getElementById(`${this.type}-project-list`)! as HTMLUListElement
        listId.innerHTML=""
        for(const prjItem of this.assignedProjects){
            const listItem=document.createElement("li")
            listItem.textContent=prjItem.title
            listId.appendChild(listItem)
        }
    }

    private attach(){
        this.hostElement.insertAdjacentElement("beforeend",this.element)
    }
    private renderContent(){
        const listId=`${this.type}-project-list`
        this.element.querySelector("ul")!.id=listId
        this.element.querySelector("h2")!.innerText=`${this.type.toUpperCase()} PROJECTS`
    }
}

class ProjectInput{
    templateElement:HTMLTemplateElement
    hostElement:HTMLElement
    element:HTMLFormElement
    titleInputElement:HTMLInputElement
    descriptionInputElement:HTMLInputElement
    peopleInputElement:HTMLInputElement
    

    constructor(){
        this.templateElement=document.getElementById("project-input")! as HTMLTemplateElement
        this.hostElement=document.getElementById("app")! as HTMLElement

        const importedNode=document.importNode(this.templateElement.content,true)
        this.element=importedNode.firstElementChild as HTMLFormElement
        this.element.id="user-input"
        this.attach()
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
            min:2,
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
    private configure(){
        this.element.addEventListener("submit",this.submitHandler)
    }
    private attach(){
        this.hostElement.insertAdjacentElement('afterbegin',this.element)
    }
}

const projectInput=new ProjectInput()
const activeProjects=new ProjectList('active')
const finishedProjects=new ProjectList('finished')
