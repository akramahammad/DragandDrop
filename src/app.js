"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
function autobind(_target, _methodName, descriptor) {
    const originalMethod = descriptor.value;
    const adjDescriptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    };
    return adjDescriptor;
}
function validate(InputElement) {
    let isValid = true;
    if (InputElement.required) {
        isValid = isValid && InputElement.value.toString().trim().length !== 0;
    }
    if (InputElement.minLength && typeof InputElement.value === "string") {
        isValid = isValid && InputElement.value.length >= InputElement.minLength;
    }
    if (InputElement.maxLength && typeof InputElement.value === "string") {
        isValid = isValid && InputElement.value.length <= InputElement.maxLength;
    }
    if (InputElement.min && typeof InputElement.value === "number") {
        isValid = isValid && InputElement.value >= InputElement.min;
    }
    if (InputElement.max && typeof InputElement.value === "number") {
        isValid = isValid && InputElement.value <= InputElement.max;
    }
    return isValid;
}
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus[ProjectStatus["Active"] = 0] = "Active";
    ProjectStatus[ProjectStatus["Finished"] = 1] = "Finished";
})(ProjectStatus || (ProjectStatus = {}));
class Project {
    constructor(id, title, description, people, status) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.people = people;
        this.status = status;
    }
}
class ProjectState {
    constructor() {
        this.projects = [];
        this.listeners = [];
    }
    static getInstance() {
        if (this.instance)
            return this.instance;
        this.instance = new ProjectState();
        return this.instance;
    }
    addProjects(title, description, people) {
        const newProject = new Project(Math.random().toString(), title, description, people, ProjectStatus.Active);
        this.projects.push(newProject);
        this.updateListeners();
    }
    moveProject(id, newStatus) {
        const proj = this.projects.find(proj => proj.id === id);
        if (proj && proj.status !== newStatus) {
            proj.status = newStatus;
            this.updateListeners();
        }
    }
    updateListeners() {
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
    addListeners(listenerFn) {
        this.listeners.push(listenerFn);
    }
}
const state = ProjectState.getInstance();
class Component {
    constructor(templateId, hostElementId, insertAtStart, newElementId) {
        this.templateElement = document.getElementById(templateId);
        this.hostElement = document.getElementById(hostElementId);
        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild;
        if (newElementId) {
            this.element.id = newElementId;
        }
        this.attach(insertAtStart);
    }
    attach(start) {
        this.hostElement.insertAdjacentElement(start ? "afterbegin" : 'beforeend', this.element);
    }
}
class ProjectItem extends Component {
    constructor(hostId, project) {
        super('single-project', hostId, false, project.id);
        this.project = project;
        this.configure();
        this.renderContent();
    }
    get persons() {
        if (this.project.people === 1) {
            return '1 person';
        }
        return `${this.project.people} people`;
    }
    configure() {
        this.element.addEventListener('dragstart', this.dragStartHandler);
        this.element.addEventListener('dragend', this.dragEndHandler);
    }
    renderContent() {
        this.element.querySelector('h2').textContent = this.project.title;
        this.element.querySelector('h3').textContent = this.persons + " assigned";
        this.element.querySelector('p').textContent = this.project.description;
    }
    dragEndHandler() {
    }
    dragStartHandler(event) {
        event.dataTransfer.setData('text/plain', this.project.id);
        event.dataTransfer.effectAllowed = 'move';
    }
}
__decorate([
    autobind
], ProjectItem.prototype, "dragEndHandler", null);
__decorate([
    autobind
], ProjectItem.prototype, "dragStartHandler", null);
class ProjectList extends Component {
    constructor(type) {
        super('project-list', 'app', false, `${type}-projects`);
        this.type = type;
        this.assignedProjects = [];
        this.renderContent();
        this.configure();
        state.addListeners((projects) => {
            const relevantProjects = projects.filter(prj => {
                if (this.type === 'active') {
                    return prj.status === ProjectStatus.Active;
                }
                return prj.status === ProjectStatus.Finished;
            });
            this.assignedProjects = relevantProjects;
            this.renderProjects();
        });
    }
    renderProjects() {
        const listId = document.getElementById(`${this.type}-project-list`);
        listId.innerHTML = "";
        for (const prjItem of this.assignedProjects) {
            new ProjectItem(this.element.querySelector('ul').id, prjItem);
        }
    }
    renderContent() {
        const listId = `${this.type}-project-list`;
        this.element.querySelector("ul").id = listId;
        this.element.querySelector("h2").innerText = `${this.type.toUpperCase()} PROJECTS`;
    }
    dragOverHandler(event) {
        event.preventDefault();
        if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            const list = this.element.querySelector('ul');
            list.classList.add('droppable');
        }
    }
    dragLeaveHandler() {
        const list = this.element.querySelector('ul');
        list.classList.remove('droppable');
    }
    dropHandler(event) {
        const projId = event.dataTransfer.getData('text/plain');
        state.moveProject(projId, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished);
    }
    configure() {
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);
    }
}
__decorate([
    autobind
], ProjectList.prototype, "dragOverHandler", null);
__decorate([
    autobind
], ProjectList.prototype, "dragLeaveHandler", null);
__decorate([
    autobind
], ProjectList.prototype, "dropHandler", null);
class ProjectInput extends Component {
    constructor() {
        super('project-input', 'app', true, 'user-input');
        this.titleInputElement = document.querySelector("#title");
        this.descriptionInputElement = document.querySelector("#description");
        this.peopleInputElement = document.querySelector("#people");
        this.configure();
    }
    getUserInput() {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = this.peopleInputElement.value;
        const titleValidatable = {
            value: enteredTitle,
            required: true,
            minLength: 3
        };
        const DescriptionValidatable = {
            value: enteredDescription,
            required: true,
            minLength: 5
        };
        const PeopleValidatable = {
            value: +enteredPeople,
            required: true,
            min: 1,
            max: 6
        };
        if (validate(titleValidatable) && validate(DescriptionValidatable) && validate(PeopleValidatable)) {
            return [enteredTitle, enteredDescription, +enteredPeople];
        }
        else {
            alert("Please enter valid input");
            return;
        }
    }
    submitHandler(e) {
        e.preventDefault();
        const userInput = this.getUserInput();
        if (Array.isArray(userInput)) {
            const [title, description, people] = userInput;
            state.addProjects(title, description, people);
            this.clearInputs();
        }
    }
    clearInputs() {
        this.titleInputElement.value = "";
        this.descriptionInputElement.value = "";
        this.peopleInputElement.value = "";
    }
    renderContent() { }
    configure() {
        this.element.addEventListener("submit", this.submitHandler);
    }
}
__decorate([
    autobind
], ProjectInput.prototype, "submitHandler", null);
const projectInput = new ProjectInput();
const activeProjects = new ProjectList('active');
const finishedProjects = new ProjectList('finished');
