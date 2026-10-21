import { toInvoiceDto } from './mappers';
import { notFound } from '../errors/httpError';
import { Invoice } from '../models';
import { accountScope } from '../models/scopes';
import { pageInfo, pageOffset } from './pagination';
import type { InvoiceListQuery } from '@qred/b2b-app-schemas';

export const listInvoices = async (userId: string, companyId: string, query: InvoiceListQuery) => {
  const where = query.status ? { status: query.status } : {};
  const include = [accountScope(userId, { where: { companyId } })];

  // Next invoice due first; id breaks ties so pages never overlap or skip rows.
  const [invoices, totalCount] = await Promise.all([
    Invoice.findAll({
      where,
      include,
      order: [
        ['dueDate', 'ASC'],
        ['id', 'ASC'],
      ],
      limit: query.limit,
      offset: pageOffset(query),
      subQuery: false,
    }),
    Invoice.count({ where, include }),
  ]);

  return {
    data: invoices.map((invoice) => toInvoiceDto(invoice, invoice.account!.currency)),
    page: pageInfo(query, totalCount),
  };
};

export const getInvoice = async (userId: string, invoiceId: string) => {
  const invoice = await Invoice.findOne({
    where: { id: invoiceId },
    include: [accountScope(userId)],
    subQuery: false,
  });

  if (!invoice?.account) {
    throw notFound('Invoice not found');
  }
  
  return toInvoiceDto(invoice, invoice.account.currency);
};
