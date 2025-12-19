export const mockCensysResponse = {
  total_hosts: 1500000,
  total_services: 5000000,
  last_sync: '2024-01-15T12:00:00.000Z',
  countries: {
    US: 500000,
    DE: 300000,
    GB: 200000,
    FR: 150000,
    JP: 100000,
    CN: 80000,
    BR: 70000,
    IN: 60000,
    CA: 50000,
    AU: 40000
  },
  services: {
    http: 2000000,
    https: 1500000,
    ssh: 800000,
    ftp: 300000,
    smtp: 200000,
    dns: 150000,
    mysql: 50000
  }
};

export const mockCensysError = {
  error: 'Unable to retrieve Censys summary',
  details: 'Network timeout',
  last_sync: '2024-01-15T12:00:00.000Z',
  total_hosts: 0,
  total_services: 0,
  countries: {},
  services: {}
};

export const mockAuth0Config = {
  domain: 'test-domain.auth0.com',
  clientId: 'test-client-id-12345'
};