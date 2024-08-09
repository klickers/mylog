import React from "react"
import { DocumentRenderer } from "@keystone-6/document-renderer"

interface Props {
	document: any
}

export default class DocRender extends React.Component<Props, {}> {
	constructor(props: Props) {
		super(props)
	}
	render() {
		return <DocumentRenderer document={this.props.document} />
	}
}
