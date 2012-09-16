#
# WrathNet Foundation
# Copyright (c) 2012 Tim Kurvers <http://wrathnet.org>
#
# World of Warcraft client foundation written in JavaScript, enabling
# development of expansion-agnostic clients, bots and other useful tools.
#
# The contents of this file are subject to the MIT License, under which
# this library is licensed. See the LICENSE file for the full license.
#

# Denotes a network packet
class WrathNet.net.Packet extends ByteBuffer

  # Creates a new packet with given opcode from given source or length
  constructor: (opcode, source, outgoing=true) ->

    # Holds the opcode for this packet
    @opcode = opcode

    # Whether this packet is outgoing or incoming
    @outgoing = outgoing

    # Default source to header size if not given
    unless source?
      source = @headerSize

    super source, ByteBuffer.LITTLE_ENDIAN

    # Seek past opcode to reserve space for it when finalizing
    @index = @headerSize

  # Header size in bytes
  @getter 'headerSize', ->
    return @constructor.HEADER_SIZE

  # Body size in bytes
  @getter 'bodySize', ->
    return @length - @headerSize

  # Retrieves the name of the opcode for this packet (if available)
  @getter 'opcodeName', ->
    return null

  # Short string representation of this packet
  toString: ->
    opcode = ('0000' + @opcode.toString(16).toUpperCase()).slice(-4)
    return "[#{@constructor.name}; Opcode: #{@opcodeName or 'UNKNOWN'} (0x#{opcode}); Length: #{@length}; Body: #{@bodySize}; Index: #{@_index}]"

  # Finalizes this packet
  finalize: ->
    return @
