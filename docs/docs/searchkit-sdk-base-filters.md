---
id: searchkit-sdk-base-filters
title: Base Filters
sidebar_label: Base Filters
slug: /core/reference/searchkit-sdk/base-filters
---

You can add lucene base filters to the search. This will be appended to the elasticsearch filter and will not appear within the `summary` response. Useful for restricting content to particular users

```js
const response = await request.execute(
  {
    hits: {
      size: 10,
    },
  },
  [{term: {status: 'published'}}], // optional second argument with an array of lucene clauses
);
```
