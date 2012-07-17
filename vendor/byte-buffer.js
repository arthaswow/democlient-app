/**
 * ByteBuffer v0.0.1
 * Copyright (c) 2012 Tim Kurvers <http://moonsphere.net>
 *
 * Wrapper for ArrayBuffer/DataView maintaining index and default endianness.
 * Supports arbitrary reading/writing, automatic growth, clipping, cloning and
 * reversing as well as UTF-8 characters and NULL-terminated C-strings.
 *
 * The contents of this file are subject to the MIT License, under which
 * this library is licensed. See the LICENSE file for the full license.
 */

var ByteBuffer;

ByteBuffer = (function() {
  'use strict';

  var extractBuffer, getter, reader, setter, writer,
    _this = this;

  ByteBuffer.LITTLE_ENDIAN = true;

  ByteBuffer.BIG_ENDIAN = false;

  getter = function(name, getter) {
    return Object.defineProperty(ByteBuffer.prototype, name, {
      get: getter,
      enumerable: true,
      configurable: true
    });
  };

  setter = function(name, setter) {
    return Object.defineProperty(ByteBuffer.prototype, name, {
      set: setter,
      enumerable: true,
      configurable: true
    });
  };

  function ByteBuffer(source, order) {
    var buffer;
    if (source == null) {
      source = 0;
    }
    if (order == null) {
      order = this.constructor.BIG_ENDIAN;
    }
    this._buffer = null;
    this._raw = null;
    this._view = null;
    this._order = order;
    this._index = 0;
    buffer = extractBuffer(source, true);
    if (!buffer) {
      buffer = new ArrayBuffer(source);
    }
    this._setup(buffer);
  }

  ByteBuffer.prototype._setup = function(buffer) {
    this._buffer = buffer;
    this._raw = new Uint8Array(this._buffer);
    return this._view = new DataView(this._buffer);
  };

  ByteBuffer.prototype._sanitizeIndex = function() {
    if (this._index < 0) {
      this._index = 0;
    }
    if (this._index > this.length) {
      return this._index = this.length;
    }
  };

  extractBuffer = function(source, clone) {
    if (clone == null) {
      clone = false;
    }
    if (source.byteLength != null) {
      if (source.buffer != null) {
        if (clone) {
          return source.buffer.slice(0);
        } else {
          return source.buffer;
        }
      } else {
        if (clone) {
          return source.slice(0);
        } else {
          return source;
        }
      }
    } else if (source.length != null) {
      try {
        return (new Uint8Array(source)).buffer;
      } catch (error) {
        return null;
      }
    } else {
      return null;
    }
  };

  getter('buffer', function() {
    return this._buffer;
  });

  getter('view', function() {
    return this._view;
  });

  getter('length', function() {
    return this._buffer.byteLength;
  });

  getter('byteLength', function() {
    return this.length;
  });

  getter('order', function() {
    return this._order;
  });

  setter('order', function(order) {
    return this._order = !!order;
  });

  getter('index', function() {
    return this._index;
  });

  setter('index', function(index) {
    if (index < 0 || index > this.length) {
      throw new RangeError('Invalid index ' + index + ', should be between 0 and ' + this.length);
    }
    return this._index = index;
  });

  ByteBuffer.prototype.front = function() {
    this._index = 0;
    return this;
  };

  ByteBuffer.prototype.end = function() {
    this._index = this.length;
    return this;
  };

  ByteBuffer.prototype.seek = function(bytes) {
    if (bytes == null) {
      bytes = 1;
    }
    this.index += bytes;
    return this;
  };

  getter('available', function() {
    return this.length - this._index;
  });

  reader = function(method, bytes) {
    return function(order) {
      var value;
      if (order == null) {
        order = this._order;
      }
      if (bytes > this.available) {
        throw new Error('Cannot read ' + bytes + ' byte(s), ' + this.available + ' available');
      }
      value = this._view[method](this._index, order);
      this._index += bytes;
      return value;
    };
  };

  writer = function(method, bytes) {
    return function(value, order) {
      if (order == null) {
        order = this._order;
      }
      if (bytes > this.available) {
        throw new Error('Cannot write ' + value + ' using ' + bytes + ' byte(s), ' + this.available + ' available');
      }
      this._view[method](this._index, value, order);
      this._index += bytes;
      return this;
    };
  };

  ByteBuffer.prototype.readByte = reader('getInt8', 1);

  ByteBuffer.prototype.readUnsignedByte = reader('getUint8', 1);

  ByteBuffer.prototype.readShort = reader('getInt16', 2);

  ByteBuffer.prototype.readUnsignedShort = reader('getUint16', 2);

  ByteBuffer.prototype.readInt = reader('getInt32', 4);

  ByteBuffer.prototype.readUnsignedInt = reader('getUint32', 4);

  ByteBuffer.prototype.readFloat = reader('getFloat32', 4);

  ByteBuffer.prototype.readDouble = reader('getFloat64', 8);

  ByteBuffer.prototype.writeByte = writer('setInt8', 1);

  ByteBuffer.prototype.writeUnsignedByte = writer('setUint8', 1);

  ByteBuffer.prototype.writeShort = writer('setInt16', 2);

  ByteBuffer.prototype.writeUnsignedShort = writer('setUint16', 2);

  ByteBuffer.prototype.writeInt = writer('setInt32', 4);

  ByteBuffer.prototype.writeUnsignedInt = writer('setUint32', 4);

  ByteBuffer.prototype.writeFloat = writer('setFloat32', 4);

  ByteBuffer.prototype.writeDouble = writer('setFloat64', 8);

  ByteBuffer.prototype.read = function(bytes) {
    var value;
    if (bytes == null) {
      bytes = this.available;
    }
    if (bytes > this.available) {
      throw new Error('Cannot read ' + bytes + ' byte(s), ' + this.available + ' available');
    }
    if (bytes <= 0) {
      throw new RangeError('Invalid number of bytes ' + bytes);
    }
    value = new this.constructor(this._buffer.slice(this._index, this._index + bytes));
    this._index += bytes;
    return value;
  };

  ByteBuffer.prototype.write = function(sequence) {
    var buffer, view;
    if (!(sequence instanceof Uint8Array)) {
      buffer = extractBuffer(sequence);
      if (!buffer) {
        throw new TypeError('Cannot write ' + sequence + ', not a sequence');
      }
      view = new Uint8Array(buffer);
    } else {
      view = sequence;
    }
    if (view.byteLength > this.available) {
      throw new Error('Cannot write ' + sequence + ' using ' + view.byteLength + ' byte(s), ' + this.available + ' available');
    }
    this._raw.set(view, this._index);
    this._index += view.byteLength;
    return this;
  };

  ByteBuffer.prototype.readString = function(bytes) {
    var b1, b2, b3, b4, c, chars, codepoints, cp, i, length, limit, raw, target;
    if (bytes == null) {
      bytes = this.available;
    }
    if (bytes > this.available) {
      throw new Error('Cannot read ' + bytes + ' byte(s), ' + this.available + ' available');
    }
    if (bytes <= 0) {
      throw new RangeError('Invalid number of bytes ' + bytes);
    }
    raw = this._raw;
    codepoints = [];
    c = 0;
    b1 = b2 = b3 = b4 = null;
    target = this._index + bytes;
    while (this._index < target) {
      b1 = raw[this._index];
      if (b1 < 128) {
        codepoints[c++] = b1;
        this._index++;
      } else if (b1 < 194) {
        throw new Error('Unexpected continuation byte');
      } else if (b1 < 224) {
        b2 = raw[this._index + 1];
        if (b2 < 128 || b2 > 191) {
          throw new Error('Bad continuation byte');
        }
        codepoints[c++] = ((b1 & 0x1F) << 6) + (b2 & 0x3F);
        this._index += 2;
      } else if (b1 < 240) {
        b2 = raw[this._index + 1];
        if (b2 < 128 || b2 > 191) {
          throw new Error('Bad continuation byte');
        }
        b3 = raw[this._index + 2];
        if (b3 < 128 || b3 > 191) {
          throw new Error('Bad continuation byte');
        }
        codepoints[c++] = ((b1 & 0x0F) << 12) + ((b2 & 0x3F) << 6) + (b3 & 0x3F);
        this._index += 3;
      } else if (b1 < 245) {
        b2 = raw[this._index + 1];
        if (b2 < 128 || b2 > 191) {
          throw new Error('Bad continuation byte');
        }
        b3 = raw[this._index + 2];
        if (b3 < 128 || b3 > 191) {
          throw new Error('Bad continuation byte');
        }
        b4 = raw[this._index + 3];
        if (b4 < 128 || b4 > 191) {
          throw new Error('Bad continuation byte');
        }
        cp = ((b1 & 0x07) << 18) + ((b2 & 0x3F) << 12) + ((b3 & 0x3F) << 6) + (b4 & 0x3F);
        cp -= 0x10000;
        codepoints[c++] = 0xD800 + ((cp & 0x0FFC00) >>> 10);
        codepoints[c++] = 0xDC00 + (cp & 0x0003FF);
        this._index += 4;
      } else {
        throw new Error('Illegal byte');
      }
    }
    limit = 1 << 16;
    length = codepoints.length;
    if (length < limit) {
      return String.fromCharCode.apply(String, codepoints);
    } else {
      chars = [];
      i = 0;
      while (i < length) {
        chars.push(String.fromCharCode.apply(String, codepoints.slice(i, i + limit)));
        i += limit;
      }
      return chars.join('');
    }
  };

  ByteBuffer.prototype.writeString = function(string) {
    var b, bytes, c, cp, d, i, length;
    bytes = [];
    length = string.length;
    i = 0;
    b = 0;
    while (i < length) {
      c = string.charCodeAt(i);
      if (c <= 0x7F) {
        bytes[b++] = c;
      } else if (c <= 0x7FF) {
        bytes[b++] = 0xC0 | ((c & 0x7C0) >>> 6);
        bytes[b++] = 0x80 | (c & 0x3F);
      } else if (c <= 0xD7FF || (c >= 0xE000 && c <= 0xFFFF)) {
        bytes[b++] = 0xE0 | ((c & 0xF000) >>> 12);
        bytes[b++] = 0x80 | ((c & 0x0FC0) >>> 6);
        bytes[b++] = 0x80 | (c & 0x3F);
      } else {
        if (i === length - 1) {
          throw new Error('Unpaired surrogate ' + string[i] + ' (index ' + i + ')');
        }
        d = string.charCodeAt(++i);
        if (c < 0xD800 || c > 0xDBFF || d < 0xDC00 || d > 0xDFFF) {
          throw new Error('Unpaired surrogate ' + string[i] + ' (index ' + i + ')');
        }
        cp = ((c & 0x03FF) << 10) + (d & 0x03FF) + 0x10000;
        bytes[b++] = 0xF0 | ((cp & 0x1C0000) >>> 18);
        bytes[b++] = 0x80 | ((cp & 0x03F000) >>> 12);
        bytes[b++] = 0x80 | ((cp & 0x000FC0) >>> 6);
        bytes[b++] = 0x80 | (cp & 0x3F);
      }
      ++i;
    }
    this.write(bytes);
    return bytes.length;
  };

  ByteBuffer.prototype.readUTFChars = ByteBuffer.prototype.readString;

  ByteBuffer.prototype.writeUTFChars = ByteBuffer.prototype.writeString;

  ByteBuffer.prototype.readCString = function() {
    var bytes, i, length, string;
    bytes = this._raw;
    length = bytes.length;
    i = this._index;
    while (bytes[i] !== 0x00 && i < length) {
      ++i;
    }
    length = i - this._index;
    if (length > 0) {
      string = this.readString(length);
      this.readByte();
      return string;
    }
    return null;
  };

  ByteBuffer.prototype.writeCString = function(string) {
    var bytes;
    bytes = this.writeString(string);
    this.writeByte(0x00);
    return ++bytes;
  };

  ByteBuffer.prototype.prepend = function(bytes) {
    var view;
    if (bytes <= 0) {
      throw new RangeError('Invalid number of bytes ' + bytes);
    }
    view = new Uint8Array(this.length + bytes);
    view.set(this._raw, bytes);
    this._setup(view.buffer);
    this._index += bytes;
    return this;
  };

  ByteBuffer.prototype.append = function(bytes) {
    var view;
    if (bytes <= 0) {
      throw new RangeError('Invalid number of bytes ' + bytes);
    }
    view = new Uint8Array(this.length + bytes);
    view.set(this._raw, 0);
    this._setup(view.buffer);
    return this;
  };

  ByteBuffer.prototype.clip = function(begin, end) {
    var buffer;
    if (begin == null) {
      begin = this._index;
    }
    if (end == null) {
      end = this.length;
    }
    if (begin < 0) {
      begin = this.length + begin;
    }
    buffer = this._buffer.slice(begin, end);
    this._setup(buffer);
    this._index -= begin;
    this._sanitizeIndex();
    return this;
  };

  ByteBuffer.prototype.clone = function() {
    var clone;
    clone = new this.constructor(this._buffer.slice(0));
    clone.index = this._index;
    return clone;
  };

  ByteBuffer.prototype.reverse = function() {
    Array.prototype.reverse.call(this._raw);
    this._index = 0;
    return this;
  };

  ByteBuffer.prototype.toArray = function() {
    return Array.prototype.slice.call(this._raw, 0);
  };

  ByteBuffer.prototype.toString = function() {
    var order;
    order = this._order === this.constructor.BIG_ENDIAN ? 'big-endian' : 'little-endian';
    return '[ByteBuffer; Order: ' + order + '; Length: ' + this.length + '; Index: ' + this._index + '; Available: ' + this.available + ']';
  };

  ByteBuffer.prototype.toHex = function(spacer) {
    if (spacer == null) {
      spacer = ' ';
    }
    return Array.prototype.map.call(this._raw, function(byte) {
      return ('00' + byte.toString(16).toUpperCase()).slice(-2);
    }).join(spacer);
  };

  ByteBuffer.prototype.toASCII = function(spacer, align, unknown) {
    var prefix;
    if (spacer == null) {
      spacer = ' ';
    }
    if (align == null) {
      align = true;
    }
    if (unknown == null) {
      unknown = '\uFFFD';
    }
    prefix = align ? ' ' : '';
    return Array.prototype.map.call(this._raw, function(byte) {
      if (byte < 0x20 || byte > 0x7E) {
        return prefix + unknown;
      } else {
        return prefix + String.fromCharCode(byte);
      }
    }).join(spacer);
  };

  return ByteBuffer;

}).call(this);