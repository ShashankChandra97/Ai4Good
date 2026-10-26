# Climate Action Lab

A local, browser-based climate scenario simulator for a class project. The team is collaborating in one GitHub repository using separate branches and assigned folders:

- `Engine/` — scenario calculations and recommendation rules (Shashank Chandra)
- `UI/` — interface and chart
- `Data/` — benchmark data and source notes

The Engine, a test dashboard in `UI/index.html`, and the Data module are available on `engine`. The Data module uses a representative example area; its annual quantities should not be presented as measured local activity. Read [PROJECT.md](PROJECT.md) for the full project context and [Engine/README.md](Engine/README.md) for the integration contract.

## Agreed direction

- Build a dashboard with a simulator for a user-defined area. Include percentage sliders for oil, electricity, and transport consumption.
- Let the user inspect both 2030 and 2035 outcomes, using the 2026 UNEP report's 18% and 45% reduction benchmarks from the 2025 baseline.
- Use percentage sliders for scenario changes.
- Have the Engine read scenario inputs from `Data/`.
- Combine an annual reduction rate and policy boost by adding their percentage points.
- Show modeled CO₂ and money benefits, plus a health-impact section. Do not claim numeric health outcomes without local air quality and population inputs.
- See [Engine handoff](Engine/README.md) for the Data format, UI call, model assumptions, and test command.

## Prompt log

Every prompt Shashank Chandra sends in this project chat is recorded here, with his name at the end of the entry. The attached project brief is available in the chat attachment; the entries below preserve the chat prompts.

### Prompt 1

> go ahead and upload this to github and give me the link so that I can share it with my team mates,

— Shashank Chandra

### Prompt 2

> drop a blank document so that i can be uploaded 
> I want this entire project to be uploaded in github

— Shashank Chandra

### Prompt 3

> I will be dealing with the Engine and my team mates will workin the UI and other on Data 
> We wont use branches , intead each will work on the folders they are assigned. 
>
> So let's start by you asking me questions to implement this solution
>
> Every prompt I type here must be saved in the readme with my name in the end 
> Don't forget.

— Shashank Chandra

### Prompt 4

> 1. Yes
> 2. There must be a flexibility to check either for 2030 or 2035&#x20;
> 3. The edits must be percentaige slider&#x20;
> 4. The engine must read from the data folder
> 5. The application is more of a dashboard with a simulator.
>
> Assuming that lets say, If one area were to reduce the consumtion of oil by 1% how much are the benifits.
>
> Similar simulations like such must be incorporated.

— Shashank Chandra

### Prompt 5

> User-defined area (recommended)
>
> CO₂, money, and health impacts
>
> Electricity, transport, and oil (recommended)
>
> Extend the trend (recommended)

— Shashank Chandra

### Prompt 6

> UNEP 2035 value: 55 (recommended)

— Shashank Chandra

### Prompt 7

> also create a project md file that contains all the information about this project so that others can find it easy to understand the coed with a context,

— Shashank Chandra

### Prompt 8

> we are using branches now, to prevent merge conflicts so use the branch I jsut created after pushing the existing stuff to the main branch.

— Shashank Chandra

### Prompt 9

> Give me the sample ui in the index so that I can test stuff as a backend engineer.

— Shashank Chandra

### Prompt 10

> try rebasing the code from the ui branch, there are some updates 

— Shashank Chandra

### Prompt 11

> So explain how this model works and give suggesting for this current ones.

— Shashank Chandra

### Prompt 12

> pull the latest changes from the Data branch

— Shashank Chandra
