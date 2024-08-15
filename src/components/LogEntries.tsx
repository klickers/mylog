import React from "react"
import InfiniteScroll from "react-infinite-scroll-component"
import { isSameDay } from "date-fns"
import DocRender from "../components/DocRender"
import dateFormat from "../scripts/dateFormat"

interface LogEntry {
	createdAt: EpochTimeStamp
	content: any
	group: LogGroup
}

interface LogGroup {
	name: string
	slug: string
	category: Array<LogCategory>
	type: LogType
}

interface LogCategory {
	name: string
	slug: string
}

interface LogType {
	name: string
	slug: string
}

interface Props {
	entriesBy?: string
	slug?: string
}

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
		let variables: any = {
			orderBy: [
				{
					createdAt: "desc",
				},
			],
			skip: this.state.start,
			take: 9,
		}
		if (this.props.entriesBy) {
			variables.where = { group: {} }
			switch (this.props.entriesBy) {
				case "group":
					variables.where.group = {
						slug: {
							equals: this.props.slug,
						},
					}
					break
				case "category":
					variables.where.group = {
						category: {
							some: {
								slug: {
									equals: this.props.slug,
								},
							},
						},
					}
					break
				case "type":
					variables.where.group = {
						type: {
							slug: {
								equals: this.props.slug,
							},
						},
					}
			}
		}
		const res = await fetch(import.meta.env.PUBLIC_API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: `
                    query AllEntries($orderBy: [LogEntryOrderByInput!]!, $skip: Int!, $take: Int${
						this.props.entriesBy
							? ", $where: LogEntryWhereInput!"
							: ""
					}) {
                        logEntries(orderBy: $orderBy, skip: $skip, take: $take${
							this.props.entriesBy ? ", where: $where" : ""
						}) {
                            createdAt
                            content {
                                document
                            }
                            group {
                                name
                                slug
                                category {
                                    name
									slug
                                }
                                type {
                                    name
									slug
                                }
                            }
                        }
                    }`,
				variables,
			}),
		})
		console.log(variables)
		const data = await res.json()
		const entries = data.data.logEntries

		this.setState((prevState) => ({
			numberOfEntries: prevState.numberOfEntries + 9,
			entries: [...prevState.entries, ...entries],
			start: prevState.start + 9,
		}))
		console.log(entries)

		if (entries.length < 9) this.setState({ hasMoreEntries: false })
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
					<p className="infinite__end-message uppercase italic">
						Yay! You've reached the end.
					</p>
				}
			>
				{this.state.entries.map((entry: LogEntry, index: number) => (
					<div className="flex gap-6 w-full" key={index}>
						<div className="prose text-nowrap w-24">
							<p
								className={`badge pt-2 pb-3 ${
									isSameDay(new Date(), entry.createdAt)
										? "badge-accent"
										: "badge-neutral"
								}`}
							>
								{dateFormat(entry.createdAt)}
							</p>
						</div>
						<div className="w-full">
							<div className="mt-1">
								<div className="flex gap-3 mb-2">
									<a
										href={`/group/${entry.group.slug}`}
										className="text-sm uppercase font-semibold"
									>
										{entry.group.name}
									</a>
									<div className="breadcrumbs text-sm">
										<ul>
											{entry.group.type ? (
												<li>
													<a
														href={`/type/${entry.group.type.slug}`}
													>
														{entry.group.type.name}
													</a>
												</li>
											) : (
												""
											)}
											{entry.group.category ? (
												<li>
													{entry.group.category.map(
														(
															cat,
															index: number
														) => (
															<a
																href={`/category/${cat.slug}`}
															>
																{cat.name}
																{index !=
																entry.group
																	.category
																	.length -
																	1
																	? ", "
																	: ""}
															</a>
														)
													)}
												</li>
											) : (
												""
											)}
										</ul>
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
