/**
 * JSON-LD node type definitions
 */

//These annotation types MUST exist, and cannot be deleted.
jsonoa.types.Annotation = jsonoa.types.register({
	template:
		'{																							' + 
		'	"@id": "?",																				' +
		'	"@type": ["http://www.w3.org/ns/oa#Annotation"],										' +
		'	"http://www.w3.org/ns/oa#motivatedBy": [],												' +
		'	"http://www.w3.org/ns/oa#annotatedBy": {"@id":"?"},										' +
		'	"http://www.w3.org/ns/oa#hasBody": [],													' +
		'	"http://www.w3.org/ns/oa#hasTarget": {"@id":"?"}										' +
		'}																							',
	constants: {
		MOTIVATED_BY: 'http://www.w3.org/ns/oa#motivatedBy',
		ANNOTATED_BY: 'http://www.w3.org/ns/oa#annotatedBy',
		BODY: 'http://www.w3.org/ns/oa#hasBody',
		TARGET: 'http://www.w3.org/ns/oa#hasTarget'
	}
});

jsonoa.types.DatasetTarget = jsonoa.types.register({
	template:
		'{																							' + 
		'	"@id": "?",																				' +
		'	"@type": "http://purl.org/dc/dcmitype/Dataset"											' +
		'}																							',
	constants: {
	}
});


//Annotation types that can be created and deleted
jsonoa.types.TextBody = jsonoa.types.register({
	template:
		'{																			' +
		'		"@id": "?",															' +
		'		"@type": [															' +
		'			"http://www.w3.org/2011/content#ContentAsText",					' +
		'			"http://purl.org/dc/dcmitype/Text"								' +
		'		],																	' +
		'		"http://purl.org/dc/elements/1.1/format": "text/plain",				' +
		'		"http://www.w3.org/2011/content#chars": "?"							' +
		'}																			',
	constants: {
			CONTENT_CHARS: 'http://www.w3.org/2011/content#chars'
	}
});

jsonoa.types.Publication = jsonoa.types.register({
	template:
		'{																											' +
		'	"@id":"?",																								' +
		'	"@type":["http://purl.org/spar/cito/CitationAct"],														' +
		'	"http://purl.org/spar/cito/hasCitationEvent": {"@id":"http://purl.org/spar/cito/citesAsDataSource"},	' +
		'	"http://purl.org/spar/cito/hasCitedEntity":{"@id":"?"},													' +
		'	"http://purl.org/spar/cito/hasCitingEntity":{"@id":"?"}													' +
		'}																											',
	constants: {
		CITED_ENTITY: 'http://purl.org/spar/cito/hasCitedEntity',
		CITING_ENTITY: 'http://purl.org/spar/cito/hasCitingEntity'
	}
});

jsonoa.types.Person = jsonoa.types.register({
	template:
	'{                                                      ' +
	'	"@id":"?",                                      ' +
	'	"@type":["http://xmlns.com/foaf/0.1/Person"],   ' +
	//'	"http://xmlns.com/foaf/0.1/mbox":{"@id":"?"},	' +
	'	"http://xmlns.com/foaf/0.1/familyName":"?",     ' +
        '	"http://xmlns.com/foaf/0.1/givenName":"?"       ' +
	'}                                                      ',
	constants: {
		//MBOX: 'http://xmlns.com/foaf/0.1/mbox',
		FAMILY_NAME: 'http://xmlns.com/foaf/0.1/familyName',
                GIVEN_NAME: 'http://xmlns.com/foaf/0.1/givenName'
	}
});

jsonoa.types.SemanticTag = jsonoa.types.register({
	template:
		'{                                                                        ' +
		'  "@id": "?",                                                            ' +
		'  "@type": "http://www.w3.org/ns/oa#SemanticTag",        ' +
		'  "http://xmlns.com/foaf/0.1/page": {                                    ' +
		'    "@id": "?"                                                           ' +
		'	}                                                                     ' +
		'}                                                                        ',
	constants: {
		PAGE: 'http://xmlns.com/foaf/0.1/page'
	}
});

jsonoa.types.Organization = jsonoa.types.register({
	template: '{                                                     ' +
		'	"@id": "?",                                        ' +
		'	"@type": "http://xmlns.com/foaf/0.1/Organization", ' +
		'	"http://xmlns.com/foaf/0.1/name": "?"              ' +
		'}                                                     ',
	constants: {
		NAME: 'http://xmlns.com/foaf/0.1/name'
	}
});

jsonoa.types.TechnicalReport = jsonoa.types.register({template: '{"@id": "?","@type": "http://purl.org/spar/fabio/TechnicalReport"}'});
jsonoa.types.ConferencePaper = jsonoa.types.register({template: '{"@id": "?","@type": "http://purl.org/spar/fabio/ConferencePaper"}'});
jsonoa.types.JournalArticle = jsonoa.types.register({template: '{"@id": "?","@type": "http://purl.org/spar/fabio/JournalArticle"}'});
jsonoa.types.Article = jsonoa.types.register({template: '{"@id": "?","@type": "http://purl.org/spar/fabio/Article"}'});
jsonoa.types.MetaDataDoc = jsonoa.types.register({template:'{"@id": "?", "@type": "http://purl.org/spar/fabio/MetadataDocument"}'});