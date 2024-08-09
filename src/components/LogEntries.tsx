import React from "react"
import InfiniteScroll from "react-infinite-scroll-component"
import { isSameDay, format } from "date-fns"
import DocRender from "../components/DocRender"

interface LogEntry {
	createdAt: EpochTimeStamp
	content: any
	group: LogGroup
}

interface LogGroup {
	name: string
	category: Array<LogCategory>
	type: LogType
}

interface LogCategory {
	name: string
}

interface LogType {
	name: string
}

interface Props {}

interface State {
	numberOfEntries: number
	hasMoreEntries: boolean
	start: number
	entries: Array<any>
}

export default class LogEntries extends React.Component<Props, State> {
	constructor(props: any) {
		super(props)

		this.state = {
			numberOfEntries: 9,
			hasMoreEntries: true,
			start: 0,
			entries: [],
		}
	}

	async componentDidMount() {
		await this.fetchNextEntries()
	}

	async fetchNextEntries() {
		const res = await fetch(import.meta.env.PUBLIC_API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: `
                    query AllEntries($orderBy: [LogEntryOrderByInput!]!, $skip: Int!) {
                        logEntries(orderBy: $orderBy, skip: $skip) {
                            createdAt
                            content {
                                document
                            }
                            group {
                                name
                                category {
                                    name
                                }
                                type {
                                    name
                                }
                            }
                        }
                    }`,
				variables: {
					orderBy: [
						{
							createdAt: "desc",
						},
					],
					skip: this.state.start,
				},
			}),
		})
		const data = await res.json()
		const entries = data.data.logEntries

		this.setState((prevState) => ({
			numberOfEntries: prevState.numberOfEntries + 9,
			entries,
		}))

		/*if (entries.length >= data.meta.pagination.total - 1) {
			console.log(entries.length, data.meta.pagination.total - 1)
			this.setState({ hasMoreEntries: false })
		}*/
	}

	render() {
		return (
			<InfiniteScroll
				className={`grid gap-8`}
				style={{ overflow: "initial" }}
				dataLength={this.state.numberOfEntries}
				next={() => this.fetchNextEntries()}
				hasMore={this.state.hasMoreEntries}
				loader={<p className="infinite__loader">Loading . . .</p>}
				endMessage={
					<p className="infinite__end-message">
						Yay! You've reached the end.
					</p>
				}
			>
				{this.state.entries.map((entry: LogEntry) => (
					<div className="flex gap-6 w-full">
						<div className="prose text-nowrap">
							<p className="badge pt-2 pb-3 badge-neutral">
								{isSameDay(new Date(), entry.createdAt)
									? format(entry.createdAt, "hh:mmbbb")
									: format(entry.createdAt, "MM dd")}
							</p>
						</div>
						<div className="w-full">
							<div className="mt-1">
								<div className="flex gap-3 mb-2">
									<div className="text-sm uppercase font-semibold">
										{entry.group.name}
									</div>
									<div className="text-sm">
										{entry.group.type.name} &gt;&nbsp;
										{entry.group.category.map(
											(cat, index: number) =>
												cat.name +
												`${
													index !=
													entry.group.category
														.length -
														1
														? ", "
														: ""
												}`
										)}
									</div>
								</div>
								<div className="prose">
									<DocRender
										document={entry.content.document}
									/>
								</div>
							</div>
						</div>
					</div>
				))}
			</InfiniteScroll>
		)
	}
}
