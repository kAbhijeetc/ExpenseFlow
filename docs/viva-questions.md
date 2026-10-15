# ExpenseFlow — Comprehensive Academic Viva & Interview Questions Guide

This document contains 30 high-yield viva questions with detailed, accurate answers tailored for database architecture, full-stack software engineering, and MongoDB evaluations.

---

### Section 1: MongoDB Core & Database Architecture

#### Q1. Why did you choose MongoDB over a traditional Relational Database (RDBMS) like MySQL for ExpenseFlow?
**Answer:**
1. **Document-Oriented Flexibility**: Personal finance entities have polymorphic characteristics (e.g., custom metadata, tags arrays, category definitions, variable payment attributes) which map naturally into JSON/BSON documents without complex multi-table joins.
2. **High-Performance Aggregation Framework**: MongoDB provides native data aggregation pipelines (`$group`, `$lookup`, `$project`, `$sort`) that process financial metrics and time-series trends directly inside the database engine without sending raw rows to Node.js.
3. **Horizontal Scalability**: MongoDB supports sharding and replica sets out of the box, whereas scaling an RDBMS horizontally requires complex sharding layers.
4. **Developer Ergonomics**: Node.js and MongoDB share a JavaScript/JSON paradigm, reducing object-relational impedance mismatch.

#### Q2. What is BSON, and how does it differ from standard JSON?
**Answer:**
BSON stands for **Binary JSON**. While JSON is a text-based format supporting only basic data types (string, number, boolean, array, object, null), BSON is a binary serialization format that:
1. Adds rich data types essential for databases: `ObjectId`, `Date`, `BinData`, `Decimal128` (arbitrary precision decimal), `Int32`, `Int64`.
2. Stores length prefixes for keys and values, enabling the database engine to traverse and index documents rapidly without parsing raw character streams.
3. Consumes less processing overhead for serialization/deserialization.

#### Q3. Explain the internal anatomy of a MongoDB `ObjectId`.
**Answer:**
A standard MongoDB `ObjectId` is a 12-byte (24 hexadecimal characters) BSON value composed of:
1. **4-byte Unix timestamp**: Representing the document's creation second since Unix epoch. This makes ObjectIds roughly sortable by creation time.
2. **5-byte random value**: Unique to the process/machine (generated once per process).
3. **3-byte incrementing counter**: Initialized to a random value and incremented with each insert.

#### Q4. What is the difference between Embedding and Referencing in MongoDB schema design? When should each be used?
**Answer:**
- **Embedding (Denormalization)**: Storing related data inside the same parent document as sub-documents or arrays.
  - *When to use*: 1-to-few relationships, data that is almost always read together, and bounded data (e.g., a transaction's tags array).
- **Referencing (Normalization)**: Storing documents in separate collections and referencing them using their `_id` (`ObjectId`).
  - *When to use*: 1-to-many or many-to-many relationships, unbounded growth (e.g., millions of transactions per user), and entities updated independently by multiple processes (e.g., Categories and Budgets).
  - *In ExpenseFlow*: Categories and Transactions are stored in separate collections using references to prevent document size growth towards the 16MB BSON limit and allow independent category modifications.

#### Q5. What is MongoDB's maximum document size limit, and why does this limit exist?
**Answer:**
The maximum document size in MongoDB is **16 Megabytes (MB)**.
This limit exists to:
1. Prevent excessive RAM utilization by single documents.
2. Maintain predictable query execution speeds and network bandwidth consumption.
3. Avoid memory fragmentation. For binary files or datasets exceeding 16MB, MongoDB provides **GridFS**.

---

### Section 2: MongoDB Aggregation Pipelines

#### Q6. What is the MongoDB Aggregation Pipeline, and how does it differ from `find()` queries?
**Answer:**
`find()` is designed for document retrieval and projection with simple filtering and sorting. In contrast, the **Aggregation Pipeline** is a framework modeled on the concept of data processing pipelines. Documents enter a multi-stage pipeline where each stage transforms the document stream:
- Computes aggregations, running totals, conditional counts, and groupings.
- Performs multi-collection lookups (`$lookup`).
- Reshapes documents (`$project`, `$addFields`).
- Calculates statistical analytics across date boundaries.

#### Q7. Explain how Aggregation 1 (Summary: Income, Expense, Net Balance, Savings Rate) works in ExpenseFlow.
**Answer:**
1. **`$match`**: Filters documents strictly belonging to `userId` within the start and end date boundaries.
2. **`$group`**: Groups with `_id: null` to aggregate across all matched documents, using conditional accumulators:
   ```javascript
   totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } }
   totalExpense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } }
   ```
3. **`$project`**: Reshapes output, calculating:
   - `netBalance = totalIncome - totalExpense`
   - `savingsRate = if totalIncome > 0 then ((totalIncome - totalExpense) / totalIncome) * 100 else 0`

#### Q8. What does the `$lookup` stage do in MongoDB, and what is its equivalent in SQL?
**Answer:**
`$lookup` performs a **left outer join** to an unsharded collection in the same database to filter in documents from the "joined" collection.
In ExpenseFlow's Category Breakdown:
```javascript
{
  $lookup: {
    from: 'categories',
    localField: '_id',
    foreignField: '_id',
    as: 'category'
  }
}
```
This joins the category document into the grouped expense stream based on `categoryId`, followed by `$unwind` to flatten the array.

#### Q9. How do you prevent division by zero errors in MongoDB aggregations?
**Answer:**
In MongoDB aggregations, division by zero results in a fatal error or `null`/`NaN`. We prevent this using the `$cond` ternary operator:
```javascript
savingsRate: {
  $cond: [
    { $gt: ['$totalIncome', 0] },
    { $multiply: [{ $divide: [{ $subtract: ['$totalIncome', '$totalExpense'] }, '$totalIncome'] }, 100] },
    0
  ]
}
```
In Month-over-Month comparison, we similarly evaluate whether the previous month's spending was zero before performing division.

#### Q10. What is the memory limit for aggregation pipeline stages, and how can it be handled?
**Answer:**
Each aggregation pipeline stage has an in-memory execution limit of **100 Megabytes (MB)**. If a stage (such as `$group` or `$sort`) exceeds 100MB of RAM:
1. An error is thrown unless `{ allowDiskUse: true }` is enabled in the query options.
2. When `allowDiskUse: true` is passed, MongoDB writes overflow data to temporary files on disk.
3. In ExpenseFlow, by indexing `{ userId: 1, date: -1 }` and matching before grouping, intermediate working sets remain compact.

---

### Section 3: Indexing & Performance Optimization

#### Q11. What is a compound index, and what is the "ESR" (Equality, Sort, Range) rule?
**Answer:**
A **compound index** indexes two or more fields within a single index structure.
The **ESR Rule** dictates the optimal order of fields in a compound index:
1. **E (Equality)**: Fields queried with exact matches come first (e.g., `userId: req.user._id`).
2. **S (Sort)**: Fields used in the `$sort` order come second (e.g., `date: -1`).
3. **R (Range)**: Fields queried with inequality/range operators come last (e.g., `date: { $gte, $lte }`).
In ExpenseFlow, `{ userId: 1, date: -1 }` and `{ userId: 1, type: 1, date: -1 }` follow the ESR rule.

#### Q12. How does MongoDB enforce uniqueness across multiple fields in ExpenseFlow?
**Answer:**
By defining a compound unique index on the collection:
```javascript
budgetSchema.index(
  { userId: 1, categoryId: 1, month: 1, year: 1 },
  { unique: true }
);
```
If a user attempts to insert a second budget for the same category, month, and year, the B-Tree index detects the duplicate key and rejects the write with error code `11000 (DuplicateKeyError)`.

#### Q13. How do you analyze query performance in MongoDB?
**Answer:**
By appending `.explain('executionStats')` to a query cursor.
Key metrics to inspect:
- `stage`: Look for `IXSCAN` (Index Scan) rather than `COLLSCAN` (Collection Scan).
- `totalDocsExamined`: Should closely match `nReturned`. If `totalDocsExamined` >> `nReturned`, the index is inefficient.
- `executionTimeMillis`: Total execution duration.

---

### Section 4: Data Integrity & Transactions

#### Q14. Does MongoDB support ACID multi-document transactions?
**Answer:**
Yes. Since MongoDB 4.0 (for replica sets) and MongoDB 4.2 (for sharded clusters), MongoDB supports multi-document **ACID transactions** using the Session API (`session.startTransaction()`, `session.commitTransaction()`).
In ExpenseFlow:
- Standalone single-document updates (`Transaction.create()`) are always atomic at the single document level.
- Multi-document referential safety is enforced via application pre-checks and unique compound constraints.

#### Q15. How does ExpenseFlow handle the currency precision issue with floating-point numbers?
**Answer:**
IEEE 754 floating-point numbers can introduce fractional rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`).
ExpenseFlow uses a two-tier strategy:
1. **Model Setter**: `set: (val) => Math.round(Number(val) * 100) / 100` truncates all values to strictly two decimal places before writing to BSON.
2. **Alternative for Enterprise Systems**: MongoDB's `Decimal128` type or storing amounts in integer smallest currency units (cents/paise) can also be used for zero-loss financial accounting.

#### Q16. How does ExpenseFlow ensure category referential integrity when deleting a category?
**Answer:**
Before executing a deletion:
```javascript
const transactionCount = await Transaction.countDocuments({ userId: req.user._id, categoryId: id });
const budgetCount = await Budget.countDocuments({ userId: req.user._id, categoryId: id });
```
If either count is greater than zero, the server blocks deletion with status code `400 Bad Request` and notifies the user to reassign or delete the associated transactions first.

---

### Section 5: Authentication & Security

#### Q17. How is authentication handled in ExpenseFlow, and why use HTTP-only cookies?
**Answer:**
1. Upon login, the server hashes the input password and verifies it against the bcrypt hash in MongoDB.
2. A cryptographically signed **JSON Web Token (JWT)** containing `{ userId, exp }` is issued.
3. The token is sent back in the JSON body AND set as an `httpOnly` cookie (`secure: isProduction, sameSite: 'lax'`).
4. **Why HTTP-only?**: Cookies marked `HttpOnly` cannot be accessed by client-side JavaScript (`document.cookie`), mitigating **Cross-Site Scripting (XSS)** token theft attacks.

#### Q18. How does ExpenseFlow protect against NoSQL Injection attacks?
**Answer:**
1. **Zod Schema Parsing**: All incoming request parameters (`req.body`, `req.query`, `req.params`) are validated against strict Zod type definitions before reaching database queries.
2. **Mongoose Model Casting**: Object IDs and types are cast strictly to schema definitions; objects containing MongoDB operator keys (e.g. `{"$gt": ""}`) are stripped or rejected.
3. **User Isolation Derivation**: Queries always filter by `req.user._id` derived from the verified JWT payload, preventing ID parameter tampering.

#### Q19. What is CSV Injection, and how did you prevent it in the export feature?
**Answer:**
**CSV Injection** (Formula Injection) occurs when untrusted user data (like transaction descriptions or notes) starts with characters like `=`, `+`, `-`, or `@`. When opened in Microsoft Excel or LibreOffice Calc, the spreadsheet executes the text as an executable formula.
**Mitigation in ExpenseFlow**:
In `csv.js`, fields starting with `=, +, -, @, \t, \r` are prepended with an apostrophe `'`, preventing formula execution, and fields containing commas or quotes are escaped according to RFC 4180.

---

### Section 6: Testing & Engineering Quality

#### Q20. How did you test the MongoDB database layer without altering production data?
**Answer:**
We used **`mongodb-memory-server`** paired with **Vitest** and **Supertest**.
During the test lifecycle:
1. `beforeAll`: Spawns a dedicated, real in-memory MongoDB instance on an ephemeral port.
2. `beforeEach`: Clears all collections between test cases to ensure complete test isolation.
3. `afterAll`: Disconnects and terminates the in-memory engine cleanly.
This tests real aggregation pipelines, unique indexes, and schema validation without mocking Mongoose or touching local/production databases.

#### Q21. Explain the difference between horizontal and vertical scaling in MongoDB.
**Answer:**
- **Vertical Scaling**: Adding more CPU, RAM, or faster NVMe storage to a single server instance. Limited by hardware ceilings and cost.
- **Horizontal Scaling (Sharding)**: Partitioning dataset collections across a cluster of multiple independent machines (shards) using a **Shard Key**. MongoDB routes queries across shards via `mongos` query routers.

#### Q22. What is a Replica Set in MongoDB, and what are its components?
**Answer:**
A **Replica Set** is a cluster of MongoDB server instances that maintain the same data copy for high availability and redundancy.
Components:
- **Primary Node**: The only node that receives write operations. Writes are recorded to the replication log (`oplog`).
- **Secondary Nodes**: Replicate the Primary's `oplog` and apply operations to their data sets. Can serve read queries if configured.
- **Arbiter**: An optional lightweight process that participates in elections but holds no data.

#### Q23. What is the difference between `$set` and full document replacement in MongoDB updates?
**Answer:**
- `$set`: An atomic field-level operator that updates only specified fields while preserving existing untouched fields in the document.
- Full Replacement: Replaces the entire document with a new object, overwriting all existing fields except `_id`.

#### Q24. How does ExpenseFlow distinguish period cash flow from lifetime balance?
**Answer:**
- **Selected-Period Cash Flow**: The net difference between income and expenses within a specific query window (`startDate` to `endDate`).
- **Lifetime Bank Account Balance**: Cannot be accurately claimed unless an application formally tracks initial opening balances, multi-account ledger transfers, and reconciliation statements. ExpenseFlow explicitly labels period totals as *Period Cash Flow* to preserve accounting truthfulness.

#### Q25. What is the role of Mongoose middleware (pre/post hooks)?
**Answer:**
Mongoose middleware allows executing code before or after certain lifecycle events (e.g., `pre('save')`, `post('remove')`, `pre('find')`).
Common uses:
- Hashing passwords before saving user documents.
- Sanitizing text and trimming whitespace.
- Cascading updates or soft deletions.

#### Q26. Why did you use Zod instead of manual `if-else` validation?
**Answer:**
Zod provides declarative, type-safe schema definitions. It automatically validates types, lengths, string patterns, and positive numeric constraints in a single pass, outputting structured error objects. This eliminates repetitive boilerplate code and standardizes API response schemas.

#### Q27. What is the difference between `$match` placed at the beginning versus the end of an aggregation pipeline?
**Answer:**
- **Early `$match`**: Allows MongoDB to leverage indexes to filter the candidate document set before processing, drastically reducing memory and CPU usage.
- **Late `$match`**: Cannot leverage indexes on initial collection data and forces the pipeline to perform expensive transforms on documents that are later discarded.

#### Q28. What are Mongoose Virtuals?
**Answer:**
Virtuals are document properties that can be gotten and set, but do not get persisted to MongoDB storage. For example, a `fullName` virtual combining `firstName` and `lastName`.

#### Q29. How does Vite provide faster frontend builds compared to Webpack?
**Answer:**
Vite uses native ES modules (ESM) during development and pre-bundles dependencies with esbuild (written in Go), which is 10–100x faster than JavaScript-based bundlers like Webpack. During production builds, it bundles using Rollup for optimal tree-shaking and minification.

#### Q30. How would you handle audit trails in a financial application like ExpenseFlow?
**Answer:**
By implementing an `AuditLog` collection or change streams (`collection.watch()`):
- Recording `userId`, `action` ('CREATE', 'UPDATE', 'DELETE'), `targetCollection`, `documentId`, `previousState`, `newState`, `ipAddress`, and `timestamp`.
- In enterprise MongoDB systems, change streams provide real-time notification streams on replica sets for event-driven auditing.
