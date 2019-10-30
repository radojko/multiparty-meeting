const EventEmitter = require('events').EventEmitter;
const Logger = require('./Logger');

const logger = new Logger('Peer');

class Peer extends EventEmitter
{
	constructor({ id, socket })
	{
		logger.info('constructor() [id:"%s", socket:"%s"]', id, socket.id);
		super();

		this._id = id;

		this._authId = null;

		this._socket = socket;

		this._closed = false;

		this._joined = false;

		this._inLobby = false;

		this._authenticated = false;

		this._displayName = false;

		this._picture = null;

		this._email = null;

		this._device = null;

		this._rtpCapabilities = null;

		this._raisedHand = false;

		this._transports = new Map();

		this._producers = new Map();

		this._consumers = new Map();

		this._checkAuthentication();

		this._handlePeer();
	}

	close()
	{
		logger.info('close()');

		this._closed = true;

		// Iterate and close all mediasoup Transport associated to this Peer, so all
		// its Producers and Consumers will also be closed.
		this.transports.forEach((transport) =>
		{
			transport.close();
		});

		if (this._socket)
			this._socket.disconnect(true);

		this.emit('close');
	}

	_handlePeer()
	{
		this.socket.use((packet, next) =>
		{
			this._checkAuthentication();

			return next();
		});

		this.socket.on('disconnect', () =>
		{
			if (this.closed)
				return;

			logger.debug('"disconnect" event [id:%s]', this.id);

			this.close();
		});
	}

	_checkAuthentication()
	{
		if (
			Boolean(this.socket.handshake.session.passport) &&
			Boolean(this.socket.handshake.session.passport.user)
		)
		{
			const {
				id,
				displayName,
				picture,
				email
			} = this.socket.handshake.session.passport.user;

			id && (this.authId = id);
			displayName && (this.displayName = displayName);
			picture && (this.picture = picture);
			email && (this.email = email);

			this.authenticated = true;
		}
		else
		{
			this.authenticated = false;
		}
	}

	get id()
	{
		return this._id;
	}

	set id(id)
	{
		this._id = id;
	}

	get authId()
	{
		return this._authId;
	}

	set authId(authId)
	{
		this._authId = authId;
	}

	get socket()
	{
		return this._socket;
	}

	set socket(socket)
	{
		this._socket = socket;
	}

	get closed()
	{
		return this._closed;
	}

	get joined()
	{
		return this._joined;
	}

	set joined(joined)
	{
		this._joined = joined;
	}

	get inLobby()
	{
		return this._inLobby;
	}

	set inLobby(inLobby)
	{
		this._inLobby = inLobby;
	}

	get authenticated()
	{
		return this._authenticated;
	}

	set authenticated(authenticated)
	{
		if (authenticated !== this._authenticated)
		{
			const oldAuthenticated = this._authenticated;

			this._authenticated = authenticated;

			this.emit('authenticationChanged', { oldAuthenticated });
		}
	}

	get displayName()
	{
		return this._displayName;
	}

	set displayName(displayName)
	{
		if (displayName !== this._displayName)
		{
			const oldDisplayName = this._displayName;

			this._displayName = displayName;
			
			this.emit('displayNameChanged', { oldDisplayName });
		}
	}

	get picture()
	{
		return this._picture;
	}

	set picture(picture)
	{
		if (picture !== this._picture)
		{
			const oldPicture = this._picture;

			this._picture = picture;
			
			this.emit('pictureChanged', { oldPicture });
		}
	}

	get email()
	{
		return this._email;
	}

	set email(email)
	{
		this._email = email;
	}

	get device()
	{
		return this._device;
	}

	set device(device)
	{
		this._device = device;
	}

	get rtpCapabilities()
	{
		return this._rtpCapabilities;
	}

	set rtpCapabilities(rtpCapabilities)
	{
		this._rtpCapabilities = rtpCapabilities;
	}

	get raisedHand()
	{
		return this._raisedHand;
	}

	set raisedHand(raisedHand)
	{
		this._raisedHand = raisedHand;
	}

	get transports()
	{
		return this._transports;
	}

	get producers()
	{
		return this._producers;
	}

	get consumers()
	{
		return this._consumers;
	}

	addTransport(id, transport)
	{
		this.transports.set(id, transport);
	}

	getTransport(id)
	{
		return this.transports.get(id);
	}

	getConsumerTransport()
	{
		return Array.from(this.transports.values())
			.find((t) => t.appData.consuming);
	}

	removeTransport(id)
	{
		this.transports.delete(id);
	}

	addProducer(id, producer)
	{
		this.producers.set(id, producer);
	}

	getProducer(id)
	{
		return this.producers.get(id);
	}

	removeProducer(id)
	{
		this.producers.delete(id);
	}

	addConsumer(id, consumer)
	{
		this.consumers.set(id, consumer);
	}

	getConsumer(id)
	{
		return this.consumers.get(id);
	}

	removeConsumer(id)
	{
		this.consumers.delete(id);
	}

	get peerInfo()
	{
		const peerInfo =
		{
			id          : this.id,
			displayName : this.displayName,
			picture     : this.picture,
			device      : this.device
		};

		return peerInfo;
	}
}

module.exports = Peer;
