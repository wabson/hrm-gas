var chai = require('chai'), expect = chai.expect;
chai.use(require('chai-datetime'));

var dateformat = require('./dateformat');

describe('date formatting and parsing', function() {

  describe('time formatting', function() {

    it('should echo empty string back again', function() {
      expect(dateformat.formatTime('')).to.equal('');
    });

    it('should format times passed as Date instances', function() {
      expect(dateformat.formatTime(new Date(2017, 0, 20, 2, 43, 6))).to.equal('2:43:06');
      expect(dateformat.formatTime(new Date(2017, 0, 20, 10, 43, 6))).to.equal('10:43:06');
    });

    it('should return times passed as strings unmodified', function() {
      expect(dateformat.formatTime('11:27:03')).to.equal('11:27:03');
    });

    it('should return race statuses passed as strings as lowercase', function() {
      expect(dateformat.formatTime('rtd')).to.equal('rtd');
      expect(dateformat.formatTime('DNS')).to.equal('dns');
    });

    it('should pad time parts with a leading zero if needed', function() {
      expect(dateformat.formatTimePart('6')).to.equal('06');
      expect(dateformat.formatTimePart(6)).to.equal('06');
      expect(dateformat.formatTimePart('26')).to.equal('26');
      expect(dateformat.formatTimePart(26)).to.equal('26');
      expect(dateformat.formatTimePart(589)).to.equal('589');
    });

  });

  describe('date formatting', function() {

    it('should echo empty string back again', function() {
      expect(dateformat.formatDate('')).to.equal('');
    });

    it('should format dates passed as Date instances', function() {
      expect(dateformat.formatDate(new Date(2017, 0, 20, 10, 43, 6))).to.equal('20/01/2017');
    });

    it('should return dates passed as strings unmodified', function() {
      expect(dateformat.formatDate('14/06/2018')).to.equal('14/06/2018');
    });

    it('should return race statuses passed as strings as lowercase', function() {
      expect(dateformat.formatDate('rtd')).to.equal('rtd');
      expect(dateformat.formatDate('DNS')).to.equal('dns');
    });

  });

  describe('time difference formatting', function() {

    it('should echo empty string back again', function() {
      expect(dateformat.formatTimeAbs('')).to.equal('');
    });

    it('should format positive time differences', function() {
      expect(dateformat.formatTimeAbs(new Date(1899, 11, 30, 1, 43, 6))).to.equal('1:43:06');
    });

    it('should format negative time differences', function() {
      expect(dateformat.formatTimeAbs(new Date(1899, 11, 30, -1, -22, -58))).to.equal('-1:22:58');
    });

  });

  describe('time allowance/penalty formatting', function() {

    it('should echo empty string back again', function() {
      expect(dateformat.formatTimePenalty('')).to.equal('');
    });

    it('should format time penalties', function() {
      expect(dateformat.formatTimePenalty('1:43:06')).to.equal('includes penalty of 1:43:06');
    });

    it('should format time allowance', function() {
      expect(dateformat.formatTimePenalty('-1:22:58')).to.equal('includes allowance of 1:22:58');
    });
  });

  describe('date parsing', function() {

    it('should echo null back again', function() {
      expect(dateformat.parseDate(null)).to.equal(null);
    });

    it('should parse YYYY-MM-DD format dates', function() {
      expect(dateformat.parseDate('2017-02-04')).to.equalDate(new Date(2017, 1, 4));
      expect(dateformat.parseDate('2017-10-15')).to.equalDate(new Date(2017, 9, 15));
    });

    it('should parse DD/MM/YY[YY] format dates', function() {
      expect(dateformat.parseDate('04/02/2017')).to.equalDate(new Date(2017, 1, 4));
      expect(dateformat.parseDate('15/10/2017')).to.equalDate(new Date(2017, 9, 15));
      expect(dateformat.parseDate('04/02/17')).to.equalDate(new Date(2017, 1, 4));
      expect(dateformat.parseDate('15/10/17')).to.equalDate(new Date(2017, 9, 15));
    });

    it('should parse times suffixed to dates', function() {
      expect(dateformat.parseDate('2017-02-04 11:04:58')).to.equalDate(new Date(2017, 1, 4, 11, 4, 58));
    });

    it('should throw exception if a bad format date is supplied', function() {
      var badDate = '20170204';
      expect(function() {
        dateformat.parseDate(badDate);
      }).to.throw('Unsupported date format for \'' + badDate + '\' - must be YYYY-MM-DD or DD/MM/YY[YY]');
    });
  });

});