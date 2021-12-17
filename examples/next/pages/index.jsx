import { withSearchkit, withSearchkitRouting } from '@searchkit/client'
import withApollo from '../hocs/withApollo'
import { getDataFromTree } from "@apollo/client/react/ssr"

import { useSearchkitVariables } from '@searchkit/client'
import { gql, useQuery } from '@apollo/client'
import { useState } from 'react'
import { HitsList, HitsGrid } from '../components/searchkit/Hits'
import {
  FacetsList,
  SearchBar,
  Pagination,
  ResetSearchButton,
  SelectedFilters,
  SortingSelector
} from '@searchkit/elastic-ui'

import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiPageSideBar,
  EuiTitle,
  EuiHorizontalRule,
  EuiButtonGroup,
  EuiFlexGroup,
  EuiFlexItem
} from '@elastic/eui'

const query = gql`
  query resultSet($query: String, $filters: [SKFiltersSet], $page: SKPageInput, $sortBy: String) {
    results(query: $query, filters: $filters) {
      summary {
        total
        appliedFilters {
          id
          identifier
          display
          label
          ... on DateRangeSelectedFilter {
            dateMin
            dateMax
          }

          ... on NumericRangeSelectedFilter {
            min
            max
          }

          ... on ValueSelectedFilter {
            value
          }
        }
        sortOptions {
          id
          label
        }
        query
      }
      hits(page: $page, sortBy: $sortBy) {
        page {
          total
          totalPages
          pageNumber
          from
          size
        }
        sortedBy
        items {
          ... on ResultHit {
            id
            fields {
              title
              writers
              actors
              plot
              poster
            }
          }
        }
      }
      facets {
        identifier
        type
        label
        display
        entries {
          label
          count
        }
      }
    }
  }
`

const Search = () => {
  const variables = useSearchkitVariables()
  const { previousData, data = previousData, loading } = useQuery(query, { variables })
  const [viewType, setViewType] = useState('list')
  const Facets = FacetsList([])
  return (
    <EuiPage>
      <EuiPageSideBar>
        <SearchBar loading={loading} />
        <EuiHorizontalRule margin="m" />
        <Facets data={data?.results} loading={loading} />
      </EuiPageSideBar>
      <EuiPageBody component="div">
        <EuiPageHeader>
          <EuiPageHeaderSection>
            <EuiTitle size="l">
              <SelectedFilters data={data?.results} loading={loading} />
            </EuiTitle>
          </EuiPageHeaderSection>
          <EuiPageHeaderSection>
            <ResetSearchButton loading={loading} />
          </EuiPageHeaderSection>
        </EuiPageHeader>
        <EuiPageContent>
          <EuiPageContentHeader>
            <EuiPageContentHeaderSection>
              <EuiTitle size="s">
                <h2>{data?.results.summary.total} Results</h2>
              </EuiTitle>
            </EuiPageContentHeaderSection>
            <EuiPageContentHeaderSection>
              <EuiFlexGroup>
                <EuiFlexItem grow={1}>
                  <SortingSelector data={data?.results} loading={loading} />
                </EuiFlexItem>
                <EuiFlexItem grow={2}>
                <EuiButtonGroup
                  legend=""
                  options={[
                    {
                      id: `grid`,
                      label: 'Grid'
                    },
                    {
                      id: `list`,
                      label: 'List'
                    }
                  ]}
                  idSelected={viewType}
                  onChange={(id) => setViewType(id)}
                />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPageContentHeaderSection>
          </EuiPageContentHeader>
          <EuiPageContentBody>
            {viewType === 'grid' ? <HitsGrid data={data} /> : <HitsList data={data} />}
            <EuiFlexGroup justifyContent="spaceAround">
              <Pagination data={data?.results} />
            </EuiFlexGroup>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  )
}

export default withApollo(withSearchkit(withSearchkitRouting(Search, {
  createURL: ({ qsModule, location, routeState }) => {
    let filters
    let typeCategoryURL = "all"
    if (routeState.filters) {
      filters = (routeState.filters).reduce((sum, filter) => {
        if (filter.identifier === "type") {
          sum.type.push(filter)
        } else {
          sum.all.push(filter)
        }
        return sum
      }, {
        type: [],
        all: []
      })
      if (filters.type.length > 0) {
        typeCategoryURL = filters.type.map((filter) => filter.value).join("_")
      }
    }

    let newRouteState = {
      ...routeState,
      ...( filters ? { filters: filters.all } : {} )
    }

    const queryString = qsModule.stringify(newRouteState, {
      addQueryPrefix: true
    })

    return `/type/${typeCategoryURL}${queryString}`
  },
  parseURL: ({ qsModule, location }) => {
    const matches = location.pathname.match(/type\/(\w+)/)
    const routeState = qsModule.parse(location.search.slice(1), { arrayLimit: 99 })

    if (matches && matches[1] && matches[1] !== "all") {
      const typeFilters = matches[1].split("_").map((value) => ({ identifier: 'type', value }))
      if (!routeState.filters) routeState.filters = []
      routeState.filters = [...routeState.filters, ...typeFilters]
    }
    return routeState

  }
})), { getDataFromTree })
