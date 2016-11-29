const {
    SET_OFFER_FROM_SKYWAY,
    SET_ANSWER_FROM_SKYWAY,
    SET_PAIR_OF_PEERIDS,
    SET_PLUGIN,
    SET_BUFFER_CANDIDATES,
    SET_HANDLE_ID,
    REQUEST_CREATE_ID,
    RESPONSE_CREATE_ID,
    setOfferFromSkyway,
    setAnswerFromSkyway,
    setPairOfPeerids,
    setPlugin,
    setBufferCandidates,
    setHandleId,
    requestJanus,
    receiveJanus
} = require('../../libs/redux-libs/actions')

const configureMockStore = require('redux-mock-store')
const thunk = require('redux-thunk')
const nock = require('nock')

console.log(setOfferFromSkyway)

describe('actions', () => {
    const offer = {type: "offer"}
    const answer = {type: "answer"}
    const connection_id = '123'
    const p2p_type = 'media'

    it('should create an action to set Offer from skyway', () => {
        const expected = {
            type: SET_OFFER_FROM_SKYWAY,
            connection_id,
            offer,
            p2p_type
        }
        expect(setOfferFromSkyway(connection_id, offer, p2p_type))
            .toEqual(expected);
    })

    it('should create an action to set Answer from skyway', () => {
        const expected = {
            type: SET_ANSWER_FROM_SKYWAY,
            connection_id,
            answer,
            p2p_type
        }
        expect(setAnswerFromSkyway(connection_id, answer, p2p_type))
            .toEqual(expected)
    })

    it('should create an action to set pair of peerids', () => {
        const client_peer_id = "id4cli"
        const ssg_peer_id = "id4ssg"

        const expected = {
            type: SET_PAIR_OF_PEERIDS,
            connection_id,
            client_peer_id,
            ssg_peer_id
        }

        expect(setPairOfPeerids(connection_id, client_peer_id, ssg_peer_id))
            .toEqual(expected)
    })


    it('should create an action to set handle_id', () => {
        const handle_id = 'handle_id'

        const expected = {
            type: SET_HANDLE_ID,
            connection_id,
            handle_id
        }

        expect(setHandleId(connection_id, handle_id))
            .toEqual(expected)
    })

    it('should create an action to set plugin as streaming', () => {
        const plugin = "streaming"

        const expected = {
            type: SET_PLUGIN,
            connection_id,
            plugin
        }

        expect(setPlugin(connection_id, plugin))
            .toEqual(expected)
    })

    it('should create an action to set plugin as skywayiot', () => {
        const plugin = "skywayiot"

        const expected = {
            type: SET_PLUGIN,
            connection_id,
            plugin
        }

        expect(setPlugin(connection_id, plugin))
            .toEqual(expected)
    })

    it('should create an action to set buffer candidates as true', () => {
        const flag = true

        const expected = {
            type: SET_BUFFER_CANDIDATES,
            connection_id,
            shouldBufferCandidates: flag
        }

        expect(setBufferCandidates(connection_id, flag))
            .toEqual(expected)
    })

    it('should create an action to set buffer candidates as false', () => {
        const flag = false

        const expected = {
            type: SET_BUFFER_CANDIDATES,
            connection_id,
            shouldBufferCandidates: flag
        }

        expect(setBufferCandidates(connection_id, flag))
            .toEqual(expected)
    })

    it('should create an action to request REQUEST_CREATE_ID to Janus', () => {
        const janus_type = REQUEST_CREATE_ID
        const transaction = 'transaction'
        const jsonBody = {payload:'body'}

        const expected = {
            type: janus_type,
            connection_id,
            transaction,
            json: jsonBody
        }

        expect(requestJanus(connection_id, janus_type, transaction, jsonBody))
            .toEqual(expected)
    })

    it('should create an action to receive janus response', () => {
        const janus_type = RESPONSE_CREATE_ID
        const transaction = 'transaction'
        const jsonBody = {payload:'response'}

        const expected = {
            type: janus_type,
            connection_id,
            transaction,
            json: jsonBody
        }

        expect(receiveJanus(connection_id, janus_type, transaction, jsonBody))
            .toEqual(expected)
    })
})
