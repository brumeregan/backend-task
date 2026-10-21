# Notes about the collaboration

To enable parallel work I suggest to use contract first approach.

Contract - the methods, the shape of the request and response, the parameters, and the errors. Written as a schema, not as text.

But to make that contract, we all need to know the product requirements and the technical limitations.

### The process

Frontend and backend split into two parallel tracks only after the contract is agreed

Before we can agree on a contract, everyone needs to understand what we build and why. I usually follow this process:

1. Requirements (Product). Product explains the requirement: what this feature is about, the value for the user, how it will be used, expected KPIs, how it will be rolled out (per market, experiment segmentation or other feature flag rules), and if we have tight deadlines. Product writes this in the feature document.

2. Clarify (everyone). Developers and designers (if needed) read the document and ask questions there. If a question is too broad or complicated, we have a meeting. After every meeting, a summary is added to the related section of the document. Then everyone says if all is clear, or if we need another round or research. Open points become actions with an owner.

3. Design the contract (Backend, reviewed by Frontend). When the requirements are clear, backend designs the API and shares the contract. No code at this stage, only the contract: methods, shape of the call, parameters, responses and errors. Frontend reviews and approves it. Miro or other tool is used for visualization, and the board is linked in the feature document.

4. Plan tasks (Developers). Developers make sure all tasks are created and have a proper tech description, with a link to the contract (Product writes ONLY user stories, not technical part). It is also good to provide timeline if it is possible to keep track on the feature.

5. Build in parallel. Frontend builds against mocks generated from the contract. Backend implements the same contract. Small parts are deployed often, behind feature flags.

6. Integrate and release. Frontend switches from mocks to the real API. Contract tests in CI check that the implementation matches the contract.

## MAIN RULE: a feature is ready for development only when the contract is agreed


### Ways of working

One document, one channel, short sync meetings with an agenda, small demos during the implementation, retro at the end (if people vote for that).

- One document per feature. I prefer one space per feature, so it is easy to track down decisions. The tool doesn't matter, but for now let's assume Notion (its AI search makes it easy to find any information later). The document is the source of truth: the product side of the feature, the final requirements or requirements per iteration, and the agreed contract with the exact schema between systems.
All collaboration happens in one channel. There we ask questions and raise discussions.

- Sync meetings with an agenda. Everyone agrees on the sync meetings. An agenda is required: no agenda, the meeting is cancelled. In sync meetings we discuss issues and obstacles, or show results (small demos).

- Changes are written down. If we find something that affects the requirements, it becomes part of the document. We decide together if it affects the ETA or can go into the next iteration.

- Contract changes are pull requests. After the contract is agreed, any change is a pull request to the shared schema. Frontend and backend both approve it. A breaking change means a new API version.


### Practices 
These practices make the process work every day

- Common API rules. Frontend and backend agree on one strategy for API schemas: only Zod, the same field naming, URNs for ids, the same error format, the same pagination.

- Shared schema package. Zod schemas live in one package used by both frontend and backend. Additionally might be used OpenAPI documentation to see all available endpoints and responses.

- Contract before work (was already mentioned before, it is core part of my approach).

- Mocks from day one. Mocks and stubs are generated from the contract early, so endpoints don't depend on infrastructure and both teams can use them.

- Contract tests in CI. Every build checks that the real responses match the schema. Mocks and real API cannot drift apart.

- Versioned APIs. All APIs are versioned, so breaking changes go into a new version and don't affect the old one.

- Deploy often. Bringing small pieces of code to production unblocks other teams earlier. Feature flags hide work in progress.

- Keep everyone inform in the feature channel about updates or possible issues, or questions.

- if the feature is too big, it is good to have a dedicated feature driver. The person that actually checks that everything is going according to the plan or we need some support.
